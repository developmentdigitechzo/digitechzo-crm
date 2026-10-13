import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { UpdateDealStageDto } from './dto/update-deal-stage.dto';
import { MarkDealWonDto } from './dto/mark-deal-won.dto';
import { MarkDealLostDto } from './dto/mark-deal-lost.dto';
import { AssignDealDto } from './dto/assign-deal.dto';
import { DealQueryDto } from './dto/deal-query.dto';
import {
  DealResponseDto,
  PaginatedDealsResponseDto,
  PipelineStageResponseDto,
  LostReasonResponseDto,
} from './dto/deal-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DealsService {
  private readonly logger = new Logger(DealsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * List deals with tenant isolation, BDE ownership scoping, filters, search, and pagination.
   */
  async findAll(
    query: DealQueryDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedDealsResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(500, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.DealWhereInput = {
      organizationId: user.organizationId,
      deletedAt: null,
    };

    // Scoped visibility: BDE_SALES sees only assigned deals
    if (user.role === 'BDE_SALES') {
      where.ownerId = user.userId;
    } else if (query.ownerId) {
      where.ownerId = query.ownerId;
    }

    if (query.stageId) where.stageId = query.stageId;
    if (query.status) where.status = query.status;
    if (query.leadId) where.leadId = query.leadId;

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { wonNotes: { contains: term, mode: 'insensitive' } },
        { lostReasonNotes: { contains: term, mode: 'insensitive' } },
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy: Prisma.DealOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [total, deals] = await Promise.all([
      this.prisma.deal.count({ where }),
      this.prisma.deal.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          stage: true,
          lead: { select: { id: true, fullName: true } },
          lostReason: true,
        },
      }),
    ]);

    return {
      items: deals.map((d) => this.mapToDealResponseDto(d)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieve single 360° deal record with scoping.
   */
  async findOne(id: string, user: AuthenticatedUser): Promise<DealResponseDto> {
    const deal = await this.prisma.deal.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        stage: true,
        lead: { select: { id: true, fullName: true } },
        lostReason: true,
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (user.role === 'BDE_SALES' && deal.ownerId !== user.userId) {
      throw new NotFoundException('Deal not found');
    }

    return this.mapToDealResponseDto(deal);
  }

  /**
   * Create a new deal with tenant boundary enforcement.
   */
  async create(dto: CreateDealDto, user: AuthenticatedUser): Promise<DealResponseDto> {
    // 1. Verify stage exists
    const stage = await this.prisma.pipelineStage.findUnique({
      where: { id: dto.stageId },
    });
    if (!stage) {
      throw new BadRequestException('Specified pipeline stage does not exist');
    }

    // 2. Verify mandatory originating lead exists and is active
    const lead = await this.prisma.lead.findFirst({
      where: {
        id: dto.leadId,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });
    if (!lead) {
      throw new BadRequestException('Associated lead not found in this organization');
    }

    // 3. Ownership resolution
    let targetOwnerId = user.userId;
    if (user.role !== 'BDE_SALES' && dto.ownerId) {
      const targetUser = await this.prisma.user.findFirst({
        where: {
          id: dto.ownerId,
          organizationId: user.organizationId,
          status: 'ACTIVE',
        },
      });
      if (!targetUser) {
        throw new BadRequestException('Assigned deal owner not found or inactive in this organization');
      }
      targetOwnerId = dto.ownerId;
    }

    // 4. Create Deal
    const createdDeal = await this.prisma.deal.create({
      data: {
        organizationId: user.organizationId,
        ownerId: targetOwnerId,
        leadId: dto.leadId,
        stageId: dto.stageId,
        title: dto.title,
        value: new Prisma.Decimal(dto.value),
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null,
        probability: dto.probability ?? 50,
        status: stage.stageType === 'WON' ? 'WON' : stage.stageType === 'LOST' ? 'LOST' : 'OPEN',
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        stage: true,
        lead: { select: { id: true, fullName: true } },
        lostReason: true,
      },
    });

    // 5. Advance lead last activity
    await this.prisma.lead.update({
      where: { id: dto.leadId },
      data: { lastActivityAt: new Date() },
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'DEAL_CREATED',
      resource: 'deals',
      resourceId: createdDeal.id,
      details: {
        title: createdDeal.title,
        value: Number(createdDeal.value),
        stageId: createdDeal.stageId,
        ownerId: createdDeal.ownerId,
      },
    });

    return this.mapToDealResponseDto(createdDeal);
  }

  /**
   * Update deal details.
   */
  async update(id: string, dto: UpdateDealDto, user: AuthenticatedUser): Promise<DealResponseDto> {
    const deal = await this.getDealOrThrow(id, user);

    const updateData: Prisma.DealUpdateInput = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.value !== undefined) updateData.value = new Prisma.Decimal(dto.value);
    if (dto.expectedCloseDate !== undefined) {
      updateData.expectedCloseDate = dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null;
    }
    if (dto.probability !== undefined) updateData.probability = dto.probability;

    const updatedDeal = await this.prisma.deal.update({
      where: { id: deal.id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        stage: true,
        lead: { select: { id: true, fullName: true } },
        lostReason: true,
      },
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'DEAL_UPDATED',
      resource: 'deals',
      resourceId: deal.id,
      details: { modifiedFields: Object.keys(dto) },
    });

    return this.mapToDealResponseDto(updatedDeal);
  }

  /**
   * Move deal to another pipeline stage.
   */
  async updateStage(
    id: string,
    dto: UpdateDealStageDto,
    user: AuthenticatedUser,
  ): Promise<DealResponseDto> {
    const deal = await this.getDealOrThrow(id, user);

    const targetStage = await this.prisma.pipelineStage.findUnique({
      where: { id: dto.stageId },
    });
    if (!targetStage) {
      throw new BadRequestException('Target pipeline stage does not exist');
    }

    const previousStageId = deal.stageId;
    let newStatus = deal.status;
    let closedAt = deal.closedAt;

    if (targetStage.stageType === 'WON') {
      newStatus = 'WON';
      closedAt = new Date();
    } else if (targetStage.stageType === 'LOST') {
      newStatus = 'LOST';
      closedAt = new Date();
    } else if (deal.status !== 'OPEN') {
      newStatus = 'OPEN';
      closedAt = null;
    }

    const updatedDeal = await this.prisma.deal.update({
      where: { id: deal.id },
      data: {
        stageId: dto.stageId,
        status: newStatus,
        closedAt,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        stage: true,
        lead: { select: { id: true, fullName: true } },
        lostReason: true,
      },
    });

    // Log activity touchpoint for stage transition
    try {
      await this.prisma.activity.create({
        data: {
          organizationId: user.organizationId,
          userId: user.userId,
          leadId: deal.leadId,
          dealId: deal.id,
          activityType: 'NOTE',
          subject: `Pipeline Stage Changed: ${targetStage.name}`,
          description: `Deal moved from previous stage to "${targetStage.name}". Stage order: ${targetStage.order}. Status: ${newStatus}`,
          outcome: 'COMPLETED',
          activityDate: new Date(),
        },
      });

      // Synchronize lead status with pipeline stage
      if (deal.leadId) {
        let correspondingLeadStatus: any = undefined;
        if (targetStage.order === 1) correspondingLeadStatus = 'NEW';
        else if (targetStage.order === 2) correspondingLeadStatus = 'CONTACTED';
        else if (targetStage.order === 3) correspondingLeadStatus = 'QUALIFIED';
        else if (targetStage.order === 4) correspondingLeadStatus = 'PROPOSAL_SENT';
        else if (targetStage.order === 5) correspondingLeadStatus = 'NEGOTIATION';
        else if (targetStage.order === 6 || targetStage.stageType === 'WON') correspondingLeadStatus = 'WON';
        else if (targetStage.order === 7 || targetStage.stageType === 'LOST') correspondingLeadStatus = 'LOST';

        if (correspondingLeadStatus) {
          await this.prisma.lead.update({
            where: { id: deal.leadId },
            data: {
              status: correspondingLeadStatus,
              lastActivityAt: new Date(),
            },
          });
        }
      }
    } catch (e: any) {
      this.logger.warn(`Failed to sync activity/lead on deal stage change: ${e.message}`);
    }

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'DEAL_STAGE_CHANGED',
      resource: 'deals',
      resourceId: deal.id,
      details: {
        previousStageId,
        newStageId: dto.stageId,
        newStatus,
      },
    });

    return this.mapToDealResponseDto(updatedDeal);
  }

  /**
   * Mark deal as WON with atomic Lead conversion and Customer creation/linking.
   */
  async markWon(id: string, dto: MarkDealWonDto, user: AuthenticatedUser): Promise<DealResponseDto> {
    const deal = await this.getDealOrThrow(id, user);

    // Find Closed Won stage
    const wonStage = await this.prisma.pipelineStage.findFirst({
      where: { stageType: 'WON' },
    });

    // Fetch the linked Lead
    const lead = await this.prisma.lead.findFirst({
      where: { id: deal.leadId, organizationId: user.organizationId, deletedAt: null },
    });
    if (!lead) {
      throw new NotFoundException(`Associated lead ${deal.leadId} not found in this organization`);
    }

    const { updatedDeal } = await this.prisma.$transaction(async (tx) => {
      // 1. Update Deal
      const updatedDeal = await tx.deal.update({
        where: { id: deal.id },
        data: {
          status: 'WON',
          stageId: wonStage ? wonStage.id : deal.stageId,
          closedAt: deal.closedAt || new Date(),
          wonNotes: dto.wonNotes || deal.wonNotes || null,
          probability: 100,
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          stage: true,
          lead: { select: { id: true, fullName: true } },
          lostReason: true,
        },
      });

      // 2. Update Lead status to CONVERTED
      let leadStatusChanged = false;
      if (lead.status !== 'CONVERTED') {
        await tx.lead.update({
          where: { id: lead.id },
          data: { status: 'CONVERTED', lastActivityAt: new Date() },
        });
        leadStatusChanged = true;
      } else {
        await tx.lead.update({
          where: { id: lead.id },
          data: { lastActivityAt: new Date() },
        });
      }

      // 3. Upsert / safely reuse Customer for this Lead
      const existingCustomer = await tx.customer.findFirst({
        where: {
          leadId: lead.id,
          organizationId: user.organizationId,
          deletedAt: null,
        },
      });

      let customerRecord;
      let isNewCustomer = false;

      if (existingCustomer) {
        // Reuse existing customer account (multi-deal / expansion scenario)
        const updatedNotes = dto.wonNotes
          ? (existingCustomer.notes
              ? `${existingCustomer.notes}\n\n[Won Deal: ${deal.title}] ${dto.wonNotes}`
              : `[Won Deal: ${deal.title}] ${dto.wonNotes}`)
          : existingCustomer.notes;

        customerRecord = await tx.customer.update({
          where: { id: existingCustomer.id },
          data: {
            dealId: deal.id,
            status: 'ACTIVE',
            notes: updatedNotes,
          },
        });
      } else {
        // Create new Customer copying master details from Lead
        const companyName = lead.companyName?.trim() || lead.fullName.trim();
        const contactName = lead.fullName.trim();
        const phone = lead.phone.trim();
        const email = lead.email?.trim() || `${phone.replace(/\D/g, '') || lead.id.slice(0, 8)}@client.digitechzo.local`;

        customerRecord = await tx.customer.create({
          data: {
            organizationId: user.organizationId,
            ownerId: deal.ownerId,
            leadId: lead.id,
            dealId: deal.id,
            companyName,
            contactName,
            title: lead.title || null,
            phone,
            email,
            country: 'India',
            status: 'ACTIVE',
            customerSince: new Date(),
            notes: dto.wonNotes ? `[Won Deal: ${deal.title}] ${dto.wonNotes}` : `Converted from Lead: ${lead.fullName}`,
          },
        });
        isNewCustomer = true;
      }

      // 4. Record Audit Logs
      if (deal.status !== 'WON') {
        await this.auditService.recordTx(tx, {
          organizationId: user.organizationId,
          userId: user.userId,
          action: 'DEAL_WON',
          resource: 'deals',
          resourceId: deal.id,
          details: { wonNotes: dto.wonNotes, value: Number(deal.value), customerId: customerRecord.id },
        });
      }

      if (leadStatusChanged) {
        await this.auditService.recordTx(tx, {
          organizationId: user.organizationId,
          userId: user.userId,
          action: 'LEAD_STATUS_CHANGED',
          resource: 'leads',
          resourceId: lead.id,
          details: { previousStatus: lead.status, newStatus: 'CONVERTED', trigger: 'DEAL_WON' },
        });
      }

      if (isNewCustomer) {
        await this.auditService.recordTx(tx, {
          organizationId: user.organizationId,
          userId: user.userId,
          action: 'CUSTOMER_CREATED',
          resource: 'customers',
          resourceId: customerRecord.id,
          details: { companyName: customerRecord.companyName, contactName: customerRecord.contactName, leadId: lead.id, dealId: deal.id, trigger: 'DEAL_WON' },
        });
      }

      return { updatedDeal, createdCustomer: customerRecord, isNewCustomer };
    });

    return this.mapToDealResponseDto(updatedDeal);
  }

  /**
   * Mark deal as LOST with atomic Lead status synchronization.
   */
  async markLost(id: string, dto: MarkDealLostDto, user: AuthenticatedUser): Promise<DealResponseDto> {
    const deal = await this.getDealOrThrow(id, user);

    const lostReason = await this.prisma.lostReason.findUnique({
      where: { id: dto.lostReasonId },
    });
    if (!lostReason) {
      throw new BadRequestException('Specified lost reason does not exist');
    }

    // Find Closed Lost stage
    const lostStage = await this.prisma.pipelineStage.findFirst({
      where: { stageType: 'LOST' },
    });

    // Fetch linked Lead
    const lead = await this.prisma.lead.findFirst({
      where: { id: deal.leadId, organizationId: user.organizationId, deletedAt: null },
    });
    if (!lead) {
      throw new NotFoundException(`Associated lead ${deal.leadId} not found in this organization`);
    }

    const updatedDeal = await this.prisma.$transaction(async (tx) => {
      // 1. Update Deal
      const updatedDeal = await tx.deal.update({
        where: { id: deal.id },
        data: {
          status: 'LOST',
          stageId: lostStage ? lostStage.id : deal.stageId,
          lostReasonId: dto.lostReasonId,
          lostReasonNotes: dto.lostReasonNotes || null,
          closedAt: deal.closedAt || new Date(),
          probability: 0,
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          stage: true,
          lead: { select: { id: true, fullName: true } },
          lostReason: true,
        },
      });

      // 2. Check if Lead has any other OPEN deals
      const otherOpenDealsCount = await tx.deal.count({
        where: {
          leadId: lead.id,
          organizationId: user.organizationId,
          deletedAt: null,
          status: 'OPEN',
          id: { not: deal.id },
        },
      });

      let leadStatusChanged = false;
      // Only transition Lead to LOST if no other open deals and lead is not already CONVERTED
      if (otherOpenDealsCount === 0 && lead.status !== 'CONVERTED' && lead.status !== 'LOST') {
        await tx.lead.update({
          where: { id: lead.id },
          data: {
            status: 'LOST',
            lastActivityAt: new Date(),
          },
        });
        leadStatusChanged = true;
      } else {
        await tx.lead.update({
          where: { id: lead.id },
          data: { lastActivityAt: new Date() },
        });
      }

      // 3. Record Audit Logs
      if (deal.status !== 'LOST') {
        await this.auditService.recordTx(tx, {
          organizationId: user.organizationId,
          userId: user.userId,
          action: 'DEAL_LOST',
          resource: 'deals',
          resourceId: deal.id,
          details: {
            lostReasonCode: lostReason.code,
            lostReasonNotes: dto.lostReasonNotes,
          },
        });
      }

      if (leadStatusChanged) {
        await this.auditService.recordTx(tx, {
          organizationId: user.organizationId,
          userId: user.userId,
          action: 'LEAD_STATUS_CHANGED',
          resource: 'leads',
          resourceId: lead.id,
          details: {
            previousStatus: lead.status,
            newStatus: 'LOST',
            lostReasonCode: lostReason.code,
            trigger: 'DEAL_LOST',
          },
        });
      }

      return updatedDeal;
    });

    return this.mapToDealResponseDto(updatedDeal);
  }

  /**
   * Reassign deal to another team member (Admin and Manager only).
   */
  async assign(id: string, dto: AssignDealDto, user: AuthenticatedUser): Promise<DealResponseDto> {
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      throw new ForbiddenException('Only administrators or managers can reassign deals');
    }

    const deal = await this.prisma.deal.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: {
        id: dto.ownerId,
        organizationId: user.organizationId,
        status: 'ACTIVE',
      },
    });
    if (!targetUser) {
      throw new BadRequestException('Target deal owner not found or inactive in this organization');
    }

    const previousOwnerId = deal.ownerId;

    const updatedDeal = await this.prisma.deal.update({
      where: { id: deal.id },
      data: { ownerId: dto.ownerId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        stage: true,
        lead: { select: { id: true, fullName: true } },
        lostReason: true,
      },
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'DEAL_REASSIGNED',
      resource: 'deals',
      resourceId: deal.id,
      details: {
        previousOwnerId,
        newOwnerId: dto.ownerId,
        reassignedBy: user.userId,
      },
    });

    return this.mapToDealResponseDto(updatedDeal);
  }

  /**
   * Soft-delete deal (Admin only).
   */
  async softDelete(id: string, user: AuthenticatedUser): Promise<{ message: string }> {
    const deal = await this.prisma.deal.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    await this.prisma.deal.update({
      where: { id: deal.id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'DEAL_DELETED',
      resource: 'deals',
      resourceId: deal.id,
      details: { deletedBy: user.userId },
    });

    return { message: 'Deal soft-deleted successfully' };
  }

  /**
   * Helper: fetches deal or throws 404 with BDE visibility scoping.
   */
  private async getDealOrThrow(id: string, user: AuthenticatedUser) {
    const deal = await this.prisma.deal.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (user.role === 'BDE_SALES' && deal.ownerId !== user.userId) {
      throw new NotFoundException('Deal not found');
    }

    return deal;
  }

  /**
   * Get all reference pipeline stages sorted by display order.
   */
  async getStages(): Promise<PipelineStageResponseDto[]> {
    const stages = await this.prisma.pipelineStage.findMany({
      orderBy: { order: 'asc' },
    });

    return stages.map((s: any) => ({
      id: s.id,
      name: s.name,
      order: s.order,
      stageType: s.stageType,
      dealCountBenchmark: s.dealCountBenchmark,
      totalValueBenchmark: Number(s.totalValueBenchmark),
    }));
  }

  /**
   * Get all active reference lost reasons.
   */
  async getLostReasons(): Promise<LostReasonResponseDto[]> {
    const reasons = await this.prisma.lostReason.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    return reasons.map((r: any) => ({
      id: r.id,
      code: r.code,
      label: r.label,
      isActive: r.isActive,
    }));
  }

  private mapToDealResponseDto(deal: any): DealResponseDto {
    return {
      id: deal.id,
      organizationId: deal.organizationId,
      ownerId: deal.ownerId,
      ownerName: deal.owner?.name ?? 'Unassigned',
      leadId: deal.leadId ?? null,
      leadName: deal.lead?.fullName ?? null,
      stageId: deal.stageId,
      stageName: deal.stage?.name ?? 'Unknown Stage',
      stage: deal.stage
        ? {
            id: deal.stage.id,
            name: deal.stage.name,
            order: deal.stage.order,
            stageType: deal.stage.stageType,
            dealCountBenchmark: deal.stage.dealCountBenchmark,
            totalValueBenchmark: Number(deal.stage.totalValueBenchmark || 0),
          }
        : undefined,
      title: deal.title,
      value: Number(deal.value),
      expectedCloseDate: deal.expectedCloseDate instanceof Date ? deal.expectedCloseDate.toISOString() : deal.expectedCloseDate,
      probability: deal.probability ?? 50,
      status: deal.status,
      lostReasonId: deal.lostReasonId ?? null,
      lostReasonLabel: deal.lostReason?.label ?? null,
      lostReasonNotes: deal.lostReasonNotes ?? null,
      closedAt: deal.closedAt instanceof Date ? deal.closedAt.toISOString() : deal.closedAt,
      wonNotes: deal.wonNotes ?? null,
      createdAt: deal.createdAt instanceof Date ? deal.createdAt.toISOString() : deal.createdAt,
      updatedAt: deal.updatedAt instanceof Date ? deal.updatedAt.toISOString() : deal.updatedAt,
    };
  }
}
