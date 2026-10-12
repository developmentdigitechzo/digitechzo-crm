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
import { CreateActivityDto } from './dto/create-activity.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { ActivityResponseDto, PaginatedActivitiesResponseDto } from './dto/activity-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Helper to map a raw Prisma Activity record into ActivityResponseDto
   */
  private mapToResponseDto(act: any): ActivityResponseDto {
    return {
      id: act.id,
      organizationId: act.organizationId,
      userId: act.userId,
      leadId: act.leadId,
      dealId: act.dealId,
      taskId: act.taskId,
      activityType: act.activityType,
      direction: act.direction,
      subject: act.subject,
      description: act.description,
      activityDate: act.activityDate,
      durationSeconds: act.durationSeconds,
      outcome: act.outcome,
      metadata: act.metadata ? (act.metadata as Record<string, any>) : undefined,
      createdAt: act.createdAt,
      updatedAt: act.updatedAt,
      user: act.user
        ? {
            id: act.user.id,
            name: act.user.name,
            email: act.user.email,
          }
        : undefined,
      lead: act.lead
        ? {
            id: act.lead.id,
            fullName: act.lead.fullName,
            companyName: act.lead.companyName,
          }
        : undefined,
      deal: act.deal
        ? {
            id: act.deal.id,
            title: act.deal.title,
          }
        : undefined,
      task: act.task
        ? {
            id: act.task.id,
            title: act.task.title,
          }
        : undefined,
    };
  }

  /**
   * List activities with timeline filters, tenant isolation, and BDE visibility scoping.
   */
  async findAll(
    query: ActivityQueryDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedActivitiesResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityWhereInput = {
      organizationId: user.organizationId,
    };

    // Scoped visibility: BDE sees own activities or those on owned leads/deals
    if (user.role === 'BDE_SALES') {
      where.OR = [
        { userId: user.userId },
        { lead: { ownerId: user.userId } },
        { deal: { ownerId: user.userId } },
      ];
    } else if (query.userId) {
      where.userId = query.userId;
    }

    if (query.leadId) where.leadId = query.leadId;
    if (query.dealId) where.dealId = query.dealId;
    if (query.taskId) where.taskId = query.taskId;
    if (query.activityType) where.activityType = query.activityType;
    if (query.direction) where.direction = query.direction;

    // Date range filter
    if (query.startDate || query.endDate) {
      where.activityDate = {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
      };
    }

    // Text search
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      const searchCondition = [
        { subject: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
        { description: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
      ];

      if (where.OR) {
        where.AND = [{ OR: searchCondition }];
      } else {
        where.OR = searchCondition;
      }
    }

    const orderBy: Prisma.ActivityOrderByWithRelationInput = {};
    const sortField = query.sortBy || 'activityDate';
    const sortDirection = query.sortOrder || 'desc';
    orderBy[sortField] = sortDirection;

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, fullName: true, companyName: true, ownerId: true } },
          deal: { select: { id: true, title: true, ownerId: true } },
          task: { select: { id: true, title: true } },
        },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      data: activities.map((a) => this.mapToResponseDto(a)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single activity by ID
   */
  async findById(id: string, user: AuthenticatedUser): Promise<ActivityResponseDto> {
    const act = await this.prisma.activity.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, fullName: true, companyName: true, ownerId: true } },
        deal: { select: { id: true, title: true, ownerId: true } },
        task: { select: { id: true, title: true } },
      },
    });

    if (!act) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    if (user.role === 'BDE_SALES') {
      const isCreator = act.userId === user.userId;
      const isLeadOwner = act.lead && act.lead.ownerId === user.userId;
      const isDealOwner = act.deal && act.deal.ownerId === user.userId;
      if (!isCreator && !isLeadOwner && !isDealOwner) {
        throw new ForbiddenException('You do not have permission to view this activity');
      }
    }

    return this.mapToResponseDto(act);
  }

  /**
   * Create a new activity record and update lead lastActivityAt if applicable
   */
  async create(dto: CreateActivityDto, user: AuthenticatedUser): Promise<ActivityResponseDto> {
    // Validate lead association if provided
    if (dto.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: {
          id: dto.leadId,
          organizationId: user.organizationId,
          deletedAt: null,
        },
      });
      if (!lead) {
        throw new BadRequestException(`Lead with ID ${dto.leadId} not found in this organization`);
      }
      if (user.role === 'BDE_SALES' && lead.ownerId !== user.userId) {
        throw new ForbiddenException('You can only log activities on leads you own');
      }
    }

    // Validate deal association if provided
    if (dto.dealId) {
      const deal = await this.prisma.deal.findFirst({
        where: {
          id: dto.dealId,
          organizationId: user.organizationId,
          deletedAt: null,
        },
      });
      if (!deal) {
        throw new BadRequestException(`Deal with ID ${dto.dealId} not found in this organization`);
      }
      if (user.role === 'BDE_SALES' && deal.ownerId !== user.userId) {
        throw new ForbiddenException('You can only log activities on deals you own');
      }
    }

    // Validate task association if provided
    if (dto.taskId) {
      const task = await this.prisma.task.findFirst({
        where: {
          id: dto.taskId,
          organizationId: user.organizationId,
          deletedAt: null,
        },
      });
      if (!task) {
        throw new BadRequestException(`Task with ID ${dto.taskId} not found in this organization`);
      }
    }

    const activityDate = dto.activityDate ? new Date(dto.activityDate) : new Date();

    const created = await this.prisma.activity.create({
      data: {
        organizationId: user.organizationId,
        userId: user.userId,
        leadId: dto.leadId || null,
        dealId: dto.dealId || null,
        taskId: dto.taskId || null,
        activityType: dto.activityType,
        direction: dto.direction || null,
        subject: dto.subject,
        description: dto.description || null,
        activityDate,
        durationSeconds: dto.durationSeconds || null,
        outcome: dto.outcome || null,
        metadata: dto.metadata || Prisma.JsonNull,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, fullName: true, companyName: true, ownerId: true } },
        deal: { select: { id: true, title: true, ownerId: true } },
        task: { select: { id: true, title: true } },
      },
    });

    // Touch lead's lastActivityAt and update lead status/temperature if appropriate
    if (dto.leadId) {
      const leadUpdateData: any = { lastActivityAt: activityDate };
      const currentLead = await this.prisma.lead.findFirst({
        where: { id: dto.leadId },
        select: { status: true },
      });

      if (currentLead && currentLead.status === 'NEW') {
        leadUpdateData.status = 'CONTACTED';
      }

      if (dto.outcome === 'CONNECTED_INTERESTED') {
        leadUpdateData.temperature = 'HOT';
      } else if (dto.outcome === 'CONNECTED_NOT_INTERESTED') {
        leadUpdateData.temperature = 'COLD';
      }

      await this.prisma.lead.update({
        where: { id: dto.leadId },
        data: leadUpdateData,
      });
    }

    // Auto-advance Stage 1 Deal to Stage 2 (Discovery) on meaningful touchpoint (CALL, WHATSAPP, MEETING, EMAIL, TASK)
    try {
      const targetLeadId = dto.leadId;
      const targetDealId = dto.dealId;
      if (targetLeadId || targetDealId) {
        const whereClause: any = {
          organizationId: user.organizationId,
          deletedAt: null,
          status: 'OPEN',
        };
        if (targetDealId) {
          whereClause.id = targetDealId;
        } else if (targetLeadId) {
          whereClause.leadId = targetLeadId;
        }

        const activeDeal: any = await this.prisma.deal.findFirst({
          where: whereClause,
          include: { stage: true },
        });

        if (activeDeal && activeDeal.stage?.order === 1) {
          const stage2 = await this.prisma.pipelineStage.findFirst({
            where: { order: 2 },
          });
          if (stage2) {
            await this.prisma.deal.update({
              where: { id: activeDeal.id },
              data: { stageId: stage2.id },
            });
            await this.auditService.record({
              organizationId: user.organizationId,
              userId: user.userId,
              action: 'DEAL_STAGE_CHANGED',
              resource: 'deals',
              resourceId: activeDeal.id,
              details: {
                previousStageId: activeDeal.stageId,
                newStageId: stage2.id,
                reason: `Auto-advanced to Discovery on activity creation (${created.activityType})`,
              },
            });
          }
        }
      }
    } catch (e: any) {
      // non-fatal
    }

    // Audit log
    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'ACTIVITY_CREATED',
      resource: 'activities',
      resourceId: created.id,
      details: {
        activityType: created.activityType,
        subject: created.subject,
        leadId: created.leadId,
        dealId: created.dealId,
      },
    });

    return this.mapToResponseDto(created);
  }
}
