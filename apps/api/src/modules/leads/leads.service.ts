import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { UpdateLeadStatusDto, LeadStatusEnum } from './dto/update-lead-status.dto';
import { UpsertLeadQualificationDto } from './dto/upsert-qualification.dto';
import { LeadQueryDto } from './dto/lead-query.dto';
import {
  LeadResponseDto,
  PaginatedLeadsResponseDto,
  LeadQualificationResponseDto,
} from './dto/lead-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * List leads with tenant isolation, BDE ownership scoping, filters, search, and pagination.
   */
  async findAll(
    query: LeadQueryDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedLeadsResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    // Base scoping: strict tenant boundary and non-deleted
    const where: Prisma.LeadWhereInput = {
      organizationId: user.organizationId,
      deletedAt: null,
    };

    // Scoped visibility: BDE_SALES sees only assigned leads
    if (user.role === 'BDE_SALES') {
      where.ownerId = user.userId;
    } else if (query.ownerId) {
      // ADMIN or MANAGER can filter by specific rep
      where.ownerId = query.ownerId;
    }

    // Faceted filters
    if (query.status) {
      where.status = query.status;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.source) {
      where.source = query.source;
    }
    if (query.temperature) {
      where.temperature = query.temperature;
    }

    // Multi-field text search
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { companyName: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { serviceInterest: { contains: term, mode: 'insensitive' } },
      ];
    }

    // Dynamic sort
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy: Prisma.LeadOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [total, leads] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          qualification: true,
        },
      }),
    ]);

    return {
      items: leads.map((lead) => this.mapToLeadResponseDto(lead)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieve single 360° lead record with scoping.
   */
  async findOne(id: string, user: AuthenticatedUser): Promise<LeadResponseDto> {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        qualification: true,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Scoped visibility: BDE_SALES cannot view unassigned leads (returns 404)
    if (user.role === 'BDE_SALES' && lead.ownerId !== user.userId) {
      throw new NotFoundException('Lead not found');
    }

    return this.mapToLeadResponseDto(lead);
  }

  /**
   * Create a new lead with tenant deduplication and audit logging.
   */
  async create(dto: CreateLeadDto, user: AuthenticatedUser): Promise<LeadResponseDto> {
    // 1. Deduplication check: active phone or email in this tenant
    const existingLead = await this.prisma.lead.findFirst({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
        OR: [{ phone: dto.phone }, { email: dto.email }],
      },
    });

    if (existingLead) {
      throw new ConflictException(
        'An active lead with this phone number or email already exists in this organization',
      );
    }

    // 2. Ownership resolution
    let targetOwnerId = user.userId;
    if (user.role !== 'BDE_SALES' && dto.ownerId) {
      // Admin/Manager assigning to another user
      const assignedUser = await this.prisma.user.findFirst({
        where: {
          id: dto.ownerId,
          organizationId: user.organizationId,
          status: 'ACTIVE',
        },
      });
      if (!assignedUser) {
        throw new BadRequestException('Assigned owner not found or inactive in this organization');
      }
      targetOwnerId = dto.ownerId;
    }

    // 3. Create record
    const createdLead = await this.prisma.lead.create({
      data: {
        organizationId: user.organizationId,
        ownerId: targetOwnerId,
        fullName: dto.fullName,
        companyName: dto.companyName || null,
        title: dto.title || null,
        phone: dto.phone,
        email: dto.email,
        source: dto.source,
        status: LeadStatusEnum.NEW,
        priority: dto.priority || 'MEDIUM',
        temperature: dto.temperature || null,
        serviceInterest: dto.serviceInterest,
        leadScore: dto.leadScore ?? null,
        nextActionDueAt: dto.nextActionDueAt ? new Date(dto.nextActionDueAt) : null,
        nextActionType: dto.nextActionType || null,
        nextActionPurpose: dto.nextActionPurpose || null,
        nextActionOwnerId: dto.nextActionDueAt ? targetOwnerId : null,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        qualification: true,
      },
    });

    // 4. Audit Log
    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'LEAD_CREATED',
      resource: 'leads',
      resourceId: createdLead.id,
      details: {
        fullName: createdLead.fullName,
        source: createdLead.source,
        priority: createdLead.priority,
        ownerId: createdLead.ownerId,
      },
    });

    return this.mapToLeadResponseDto(createdLead);
  }

  /**
   * Update lead details with scoping and deduplication.
   */
  async update(
    id: string,
    dto: UpdateLeadDto,
    user: AuthenticatedUser,
  ): Promise<LeadResponseDto> {
    // 1. Verify existence and visibility
    const lead = await this.getLeadOrThrow(id, user);

    // 2. Deduplication check if phone or email changed
    if (dto.phone || dto.email) {
      const duplicateConditions: Prisma.LeadWhereInput[] = [];
      if (dto.phone && dto.phone !== lead.phone) {
        duplicateConditions.push({ phone: dto.phone });
      }
      if (dto.email && dto.email !== lead.email) {
        duplicateConditions.push({ email: dto.email });
      }

      if (duplicateConditions.length > 0) {
        const existing = await this.prisma.lead.findFirst({
          where: {
            id: { not: id },
            organizationId: user.organizationId,
            deletedAt: null,
            OR: duplicateConditions,
          },
        });
        if (existing) {
          throw new ConflictException(
            'An active lead with this phone number or email already exists in this organization',
          );
        }
      }
    }

    // 3. Build update payload
    const updateData: Prisma.LeadUpdateInput = {
      lastActivityAt: new Date(),
    };

    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.companyName !== undefined) updateData.companyName = dto.companyName;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.temperature !== undefined) updateData.temperature = dto.temperature;
    if (dto.serviceInterest !== undefined) updateData.serviceInterest = dto.serviceInterest;
    if (dto.leadScore !== undefined) updateData.leadScore = dto.leadScore;

    if (dto.nextActionDueAt !== undefined) {
      updateData.nextActionDueAt = dto.nextActionDueAt ? new Date(dto.nextActionDueAt) : null;
    }
    if (dto.nextActionType !== undefined) updateData.nextActionType = dto.nextActionType;
    if (dto.nextActionPurpose !== undefined) updateData.nextActionPurpose = dto.nextActionPurpose;

    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        qualification: true,
      },
    });

    // 4. Audit Log
    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'LEAD_UPDATED',
      resource: 'leads',
      resourceId: updatedLead.id,
      details: { modifiedFields: Object.keys(dto) },
    });

    return this.mapToLeadResponseDto(updatedLead);
  }

  /**
   * Reassign lead to a new team member. Restricted to ADMIN and MANAGER.
   */
  async assign(
    id: string,
    dto: AssignLeadDto,
    user: AuthenticatedUser,
  ): Promise<LeadResponseDto> {
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      throw new ForbiddenException('Only administrators or managers can reassign leads');
    }

    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Verify target user belongs to same organization and is active
    const targetUser = await this.prisma.user.findFirst({
      where: {
        id: dto.ownerId,
        organizationId: user.organizationId,
        status: 'ACTIVE',
      },
    });

    if (!targetUser) {
      throw new BadRequestException('Target owner not found or inactive in this organization');
    }

    const previousOwnerId = lead.ownerId;

    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: {
        ownerId: dto.ownerId,
        lastActivityAt: new Date(),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        qualification: true,
      },
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'LEAD_REASSIGNED',
      resource: 'leads',
      resourceId: id,
      details: {
        previousOwnerId,
        newOwnerId: dto.ownerId,
        reassignedBy: user.userId,
      },
    });

    return this.mapToLeadResponseDto(updatedLead);
  }

  /**
   * Transition lead lifecycle status with qualification governance.
   */
  async updateStatus(
    id: string,
    dto: UpdateLeadStatusDto,
    user: AuthenticatedUser,
  ): Promise<LeadResponseDto> {
    const lead = await this.getLeadOrThrow(id, user);

    if (dto.status === LeadStatusEnum.UNQUALIFIED && !dto.unqualifiedReason) {
      throw new BadRequestException('unqualifiedReason is required when status is UNQUALIFIED');
    }

    const previousStatus = lead.status;

    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: {
        status: dto.status,
        unqualifiedReason: dto.status === LeadStatusEnum.UNQUALIFIED ? dto.unqualifiedReason : null,
        unqualifiedNotes: dto.status === LeadStatusEnum.UNQUALIFIED ? dto.unqualifiedNotes : null,
        lastActivityAt: new Date(),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        qualification: true,
      },
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'LEAD_STATUS_CHANGED',
      resource: 'leads',
      resourceId: id,
      details: {
        previousStatus,
        newStatus: dto.status,
        unqualifiedReason: dto.unqualifiedReason || null,
      },
    });

    return this.mapToLeadResponseDto(updatedLead);
  }

  /**
   * Get BANT qualification for lead.
   */
  async getQualification(
    id: string,
    user: AuthenticatedUser,
  ): Promise<LeadQualificationResponseDto | null> {
    const lead = await this.getLeadOrThrow(id, user);

    const qualification = await this.prisma.leadQualification.findUnique({
      where: { leadId: lead.id },
    });

    return qualification ? this.mapToQualificationResponseDto(qualification) : null;
  }

  /**
   * Upsert BANT qualification criteria for lead.
   */
  async upsertQualification(
    id: string,
    dto: UpsertLeadQualificationDto,
    user: AuthenticatedUser,
  ): Promise<LeadQualificationResponseDto> {
    const lead = await this.getLeadOrThrow(id, user);

    const qualification = await this.prisma.leadQualification.upsert({
      where: { leadId: lead.id },
      create: {
        leadId: lead.id,
        budgetAmount: dto.budgetAmount !== undefined ? new Prisma.Decimal(dto.budgetAmount) : null,
        budgetStatus: dto.budgetStatus || null,
        authorityLevel: dto.authorityLevel || null,
        timelineHorizon: dto.timelineHorizon || null,
        urgencyRating: dto.urgencyRating ?? 3,
        problemStatement: dto.problemStatement || null,
        notes: dto.notes || null,
        qualifiedByUserId: user.userId,
      },
      update: {
        budgetAmount: dto.budgetAmount !== undefined ? new Prisma.Decimal(dto.budgetAmount) : undefined,
        budgetStatus: dto.budgetStatus !== undefined ? dto.budgetStatus : undefined,
        authorityLevel: dto.authorityLevel !== undefined ? dto.authorityLevel : undefined,
        timelineHorizon: dto.timelineHorizon !== undefined ? dto.timelineHorizon : undefined,
        urgencyRating: dto.urgencyRating !== undefined ? dto.urgencyRating : undefined,
        problemStatement: dto.problemStatement !== undefined ? dto.problemStatement : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
        qualifiedByUserId: user.userId,
      },
    });

    // Touch lead lastActivityAt
    await this.prisma.lead.update({
      where: { id: lead.id },
      data: { lastActivityAt: new Date() },
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'LEAD_QUALIFIED',
      resource: 'leads',
      resourceId: lead.id,
      details: {
        budgetStatus: dto.budgetStatus,
        authorityLevel: dto.authorityLevel,
        timelineHorizon: dto.timelineHorizon,
        urgencyRating: dto.urgencyRating,
      },
    });

    return this.mapToQualificationResponseDto(qualification);
  }

  /**
   * Soft-delete lead (Restricted to ADMIN).
   */
  async softDelete(id: string, user: AuthenticatedUser): Promise<{ message: string }> {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    await this.prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'LEAD_DELETED',
      resource: 'leads',
      resourceId: id,
      details: { deletedBy: user.userId },
    });

    return { message: 'Lead soft-deleted successfully' };
  }

  /**
   * Helper: fetches lead or throws 404 with BDE visibility checking.
   */
  private async getLeadOrThrow(id: string, user: AuthenticatedUser) {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (user.role === 'BDE_SALES' && lead.ownerId !== user.userId) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  /**
   * DTO adapter helper: maps Prisma Lead model to LeadResponseDto.
   * Guarantees 100% compatibility with E1 frontend expectations.
   */
  private mapToLeadResponseDto(lead: any): LeadResponseDto {
    const hasNextAction =
      lead.nextActionDueAt ||
      lead.nextActionType ||
      lead.nextActionPurpose ||
      lead.nextActionOwnerId;

    return {
      id: lead.id,
      organizationId: lead.organizationId,
      fullName: lead.fullName,
      companyName: lead.companyName ?? null,
      title: lead.title ?? null,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      status: lead.status,
      priority: lead.priority,
      temperature: lead.temperature ?? null,
      leadScore: lead.leadScore ?? null,
      serviceInterest: lead.serviceInterest,
      ownerId: lead.ownerId,
      ownerName: lead.owner?.name ?? 'Unassigned',
      unqualifiedReason: lead.unqualifiedReason ?? null,
      unqualifiedNotes: lead.unqualifiedNotes ?? null,
      lastActivityAt: lead.lastActivityAt instanceof Date ? lead.lastActivityAt.toISOString() : lead.lastActivityAt,
      createdAt: lead.createdAt instanceof Date ? lead.createdAt.toISOString() : lead.createdAt,
      updatedAt: lead.updatedAt instanceof Date ? lead.updatedAt.toISOString() : lead.updatedAt,
      nextAction: hasNextAction
        ? {
            dueDate: lead.nextActionDueAt ? new Date(lead.nextActionDueAt).toISOString() : undefined,
            type: lead.nextActionType ?? undefined,
            purpose: lead.nextActionPurpose ?? undefined,
            ownerId: lead.nextActionOwnerId ?? undefined,
          }
        : null,
      qualification: lead.qualification
        ? this.mapToQualificationResponseDto(lead.qualification)
        : null,
    };
  }

  /**
   * DTO adapter helper: maps Prisma LeadQualification to LeadQualificationResponseDto.
   */
  private mapToQualificationResponseDto(qual: any): LeadQualificationResponseDto {
    return {
      id: qual.id,
      leadId: qual.leadId,
      budgetAmount: qual.budgetAmount ? Number(qual.budgetAmount) : null,
      budgetStatus: qual.budgetStatus ?? null,
      authorityLevel: qual.authorityLevel ?? null,
      timelineHorizon: qual.timelineHorizon ?? null,
      urgencyRating: qual.urgencyRating ?? null,
      problemStatement: qual.problemStatement ?? null,
      notes: qual.notes ?? null,
      qualifiedByUserId: qual.qualifiedByUserId ?? null,
      qualifiedAt: qual.qualifiedAt instanceof Date ? qual.qualifiedAt.toISOString() : qual.qualifiedAt,
      updatedAt: qual.updatedAt instanceof Date ? qual.updatedAt.toISOString() : qual.updatedAt,
    };
  }
}
