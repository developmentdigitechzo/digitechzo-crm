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
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, TaskStatusEnum } from './dto/update-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskResponseDto, PaginatedTasksResponseDto } from './dto/task-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Helper to map a raw Prisma Task record into TaskResponseDto
   */
  private mapToResponseDto(task: any): TaskResponseDto {
    return {
      id: task.id,
      organizationId: task.organizationId,
      assigneeId: task.assigneeId,
      creatorId: task.creatorId,
      leadId: task.leadId,
      dealId: task.dealId,
      taskType: task.taskType,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
      completedAt: task.completedAt,
      completionNotes: task.completionNotes,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            name: task.assignee.name,
            email: task.assignee.email,
          }
        : undefined,
      creator: task.creator
        ? {
            id: task.creator.id,
            name: task.creator.name,
            email: task.creator.email,
          }
        : undefined,
      lead: task.lead
        ? {
            id: task.lead.id,
            fullName: task.lead.fullName,
            companyName: task.lead.companyName,
          }
        : undefined,
      deal: task.deal
        ? {
            id: task.deal.id,
            title: task.deal.title,
            value: Number(task.deal.value),
          }
        : undefined,
    };
  }

  /**
   * Synchronize the lightweight nextAction snapshot on the Lead.
   * Finds the earliest pending/in-progress task for that lead and updates Lead fields.
   */
  async syncLeadNextAction(leadId: string, organizationId: string): Promise<void> {
    try {
      const nextTask = await this.prisma.task.findFirst({
        where: {
          leadId,
          organizationId,
          deletedAt: null,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
        orderBy: { dueDate: 'asc' },
      });

      if (nextTask) {
        await this.prisma.lead.update({
          where: { id: leadId },
          data: {
            nextActionDueAt: nextTask.dueDate,
            nextActionType: nextTask.taskType,
            nextActionPurpose: nextTask.title,
            nextActionOwnerId: nextTask.assigneeId,
          },
        });
      } else {
        await this.prisma.lead.update({
          where: { id: leadId },
          data: {
            nextActionDueAt: null,
            nextActionType: null,
            nextActionPurpose: null,
            nextActionOwnerId: null,
          },
        });
      }
    } catch (err: any) {
      this.logger.error(`Failed to sync next-action snapshot for lead ${leadId}: ${err.message}`);
    }
  }

  /**
   * List tasks with tenant isolation, BDE scoping, filters, search, and pagination.
   */
  async findAll(
    query: TaskQueryDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedTasksResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(500, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      organizationId: user.organizationId,
      deletedAt: null,
    };

    // Scoped visibility: BDE_SALES sees only assigned or created tasks
    if (user.role === 'BDE_SALES') {
      where.OR = [
        { assigneeId: user.userId },
        { creatorId: user.userId },
      ];
    } else if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.taskType) where.taskType = query.taskType;
    if (query.leadId) where.leadId = query.leadId;
    if (query.dealId) where.dealId = query.dealId;

    // Overdue filter
    if (query.overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { in: ['PENDING', 'IN_PROGRESS'] };
    }

    // Due today filter
    if (query.dueToday) {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999);

      where.dueDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
      where.status = { in: ['PENDING', 'IN_PROGRESS'] };
    }

    // Date range filters
    if (query.dueDateFrom || query.dueDateTo) {
      where.dueDate = {
        ...(where.dueDate && typeof where.dueDate === 'object' ? where.dueDate : {}),
        ...(query.dueDateFrom ? { gte: new Date(query.dueDateFrom) } : {}),
        ...(query.dueDateTo ? { lte: new Date(query.dueDateTo) } : {}),
      };
    }

    // Text search
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      const searchCondition = [
        { title: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
        { description: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
      ];

      if (where.OR) {
        where.AND = [{ OR: searchCondition }];
      } else {
        where.OR = searchCondition;
      }
    }

    const orderBy: Prisma.TaskOrderByWithRelationInput = {};
    const sortField = query.sortBy || 'dueDate';
    const sortDirection = query.sortOrder || 'asc';
    orderBy[sortField] = sortDirection;

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, fullName: true, companyName: true } },
          deal: { select: { id: true, title: true, value: true } },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks.map((t) => this.mapToResponseDto(t)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single task by ID
   */
  async findById(id: string, user: AuthenticatedUser): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, fullName: true, companyName: true } },
        deal: { select: { id: true, title: true, value: true } },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    if (
      user.role === 'BDE_SALES' &&
      task.assigneeId !== user.userId &&
      task.creatorId !== user.userId
    ) {
      throw new ForbiddenException('You do not have permission to view this task');
    }

    return this.mapToResponseDto(task);
  }

  /**
   * Create a new task and sync lead next-action if associated
   */
  async create(dto: CreateTaskDto, user: AuthenticatedUser): Promise<TaskResponseDto> {
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
    }

    // Assignee validation & BDE restriction
    let targetAssigneeId = user.userId;
    if (dto.assigneeId) {
      if (user.role === 'BDE_SALES' && dto.assigneeId !== user.userId) {
        throw new ForbiddenException('BDE sales representatives can only assign tasks to themselves');
      }

      const assignee = await this.prisma.user.findFirst({
        where: {
          id: dto.assigneeId,
          organizationId: user.organizationId,
          status: 'ACTIVE',
        },
      });
      if (!assignee) {
        throw new BadRequestException(`Assignee user not found or inactive`);
      }
      targetAssigneeId = dto.assigneeId;
    }

    const createdTask = await this.prisma.task.create({
      data: {
        organizationId: user.organizationId,
        assigneeId: targetAssigneeId,
        creatorId: user.userId,
        leadId: dto.leadId || null,
        dealId: dto.dealId || null,
        taskType: dto.taskType,
        title: dto.title,
        description: dto.description || null,
        dueDate: new Date(dto.dueDate),
        priority: dto.priority || 'MEDIUM',
        status: 'PENDING',
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, fullName: true, companyName: true } },
        deal: { select: { id: true, title: true, value: true } },
      },
    });

    // Sync lead snapshot if attached to a lead
    if (createdTask.leadId) {
      await this.syncLeadNextAction(createdTask.leadId, user.organizationId);
    }

    // Audit log
    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'TASK_CREATED',
      resource: 'tasks',
      resourceId: createdTask.id,
      details: {
        title: createdTask.title,
        taskType: createdTask.taskType,
        dueDate: createdTask.dueDate,
        assigneeId: createdTask.assigneeId,
        leadId: createdTask.leadId,
        dealId: createdTask.dealId,
      },
    });

    return this.mapToResponseDto(createdTask);
  }

  /**
   * Update task details
   */
  async update(id: string, dto: UpdateTaskDto, user: AuthenticatedUser): Promise<TaskResponseDto> {
    const existing = await this.prisma.task.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    if (
      user.role === 'BDE_SALES' &&
      existing.assigneeId !== user.userId &&
      existing.creatorId !== user.userId
    ) {
      throw new ForbiddenException('You do not have permission to edit this task');
    }

    // Validate relations if updated
    if (dto.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: { id: dto.leadId, organizationId: user.organizationId, deletedAt: null },
      });
      if (!lead) throw new BadRequestException(`Lead ${dto.leadId} not found`);
    }

    if (dto.dealId) {
      const deal = await this.prisma.deal.findFirst({
        where: { id: dto.dealId, organizationId: user.organizationId, deletedAt: null },
      });
      if (!deal) throw new BadRequestException(`Deal ${dto.dealId} not found`);
    }

    const updateData: Prisma.TaskUpdateInput = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.taskType !== undefined) updateData.taskType = dto.taskType;
    if (dto.dueDate !== undefined) updateData.dueDate = new Date(dto.dueDate);
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.leadId !== undefined) {
      updateData.lead = dto.leadId ? { connect: { id: dto.leadId } } : { disconnect: true };
    }
    if (dto.dealId !== undefined) {
      updateData.deal = dto.dealId ? { connect: { id: dto.dealId } } : { disconnect: true };
    }

    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === TaskStatusEnum.COMPLETED && !existing.completedAt) {
        updateData.completedAt = new Date();
      } else if (dto.status !== TaskStatusEnum.COMPLETED && existing.completedAt) {
        updateData.completedAt = null;
        updateData.completionNotes = null;
      }
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, fullName: true, companyName: true } },
        deal: { select: { id: true, title: true, value: true } },
      },
    });

    // If lead was connected or disconnected, sync both old and new lead
    if (existing.leadId) {
      await this.syncLeadNextAction(existing.leadId, user.organizationId);
    }
    if (updatedTask.leadId && updatedTask.leadId !== existing.leadId) {
      await this.syncLeadNextAction(updatedTask.leadId, user.organizationId);
    }

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'TASK_UPDATED',
      resource: 'tasks',
      resourceId: updatedTask.id,
      details: {
        oldValues: {
          title: existing.title,
          status: existing.status,
          dueDate: existing.dueDate,
          priority: existing.priority,
        },
        newValues: {
          title: updatedTask.title,
          status: updatedTask.status,
          dueDate: updatedTask.dueDate,
          priority: updatedTask.priority,
        },
      },
    });

    return this.mapToResponseDto(updatedTask);
  }

  /**
   * Complete a task and optionally log an activity
   */
  async complete(id: string, dto: CompleteTaskDto, user: AuthenticatedUser): Promise<TaskResponseDto> {
    const existing = await this.prisma.task.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    if (
      user.role === 'BDE_SALES' &&
      existing.assigneeId !== user.userId &&
      existing.creatorId !== user.userId
    ) {
      throw new ForbiddenException('You do not have permission to complete this task');
    }

    const completedAt = new Date();
    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt,
        completionNotes: dto.completionNotes || null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, fullName: true, companyName: true } },
        deal: { select: { id: true, title: true, value: true } },
      },
    });

    // Optional activity recording (default true)
    if (dto.createActivity !== false) {
      await this.prisma.activity.create({
        data: {
          organizationId: user.organizationId,
          userId: user.userId,
          taskId: existing.id,
          leadId: existing.leadId,
          dealId: existing.dealId,
          activityType: existing.taskType || 'TASK',
          subject: `Task Completed: ${existing.title}`,
          description: dto.completionNotes || `Completed task on ${completedAt.toISOString()}`,
          outcome: 'COMPLETED',
          activityDate: completedAt,
        },
      });

      // Update lead lastActivityAt if associated
      if (existing.leadId) {
        await this.prisma.lead.update({
          where: { id: existing.leadId },
          data: { lastActivityAt: completedAt },
        });
      }
    }

    // Auto-advance Stage 1 Deal to Stage 2 (Discovery) on task completion
    try {
      const targetLeadId = existing.leadId;
      const targetDealId = existing.dealId;
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
                reason: 'Auto-advanced to Discovery on task/follow-up completion',
              },
            });
          }
        }
      }
    } catch (e: any) {
      this.logger.warn(`Failed to auto-advance deal on task completion: ${e.message}`);
    }

    // Sync lead next action
    if (existing.leadId) {
      await this.syncLeadNextAction(existing.leadId, user.organizationId);
    }

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'TASK_COMPLETED',
      resource: 'tasks',
      resourceId: updated.id,
      details: {
        completedAt,
        completionNotes: dto.completionNotes,
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Reopen a completed task
   */
  async reopen(id: string, user: AuthenticatedUser): Promise<TaskResponseDto> {
    const existing = await this.prisma.task.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    if (
      user.role === 'BDE_SALES' &&
      existing.assigneeId !== user.userId &&
      existing.creatorId !== user.userId
    ) {
      throw new ForbiddenException('You do not have permission to reopen this task');
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: 'PENDING',
        completedAt: null,
        completionNotes: null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, fullName: true, companyName: true } },
        deal: { select: { id: true, title: true, value: true } },
      },
    });

    if (existing.leadId) {
      await this.syncLeadNextAction(existing.leadId, user.organizationId);
    }

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'TASK_REOPENED',
      resource: 'tasks',
      resourceId: updated.id,
      details: {},
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Reassign a task to another user (Admin & Manager only)
   */
  async assign(id: string, dto: AssignTaskDto, user: AuthenticatedUser): Promise<TaskResponseDto> {
    if (user.role === 'BDE_SALES') {
      throw new ForbiddenException('Only ADMIN and MANAGER can reassign tasks');
    }

    const existing = await this.prisma.task.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const targetUser = await this.prisma.user.findFirst({
      where: {
        id: dto.assigneeId,
        organizationId: user.organizationId,
        status: 'ACTIVE',
      },
    });

    if (!targetUser) {
      throw new BadRequestException('Target assignee not found or inactive');
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: { assigneeId: dto.assigneeId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, fullName: true, companyName: true } },
        deal: { select: { id: true, title: true, value: true } },
      },
    });

    if (existing.leadId) {
      await this.syncLeadNextAction(existing.leadId, user.organizationId);
    }

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'TASK_REASSIGNED',
      resource: 'tasks',
      resourceId: updated.id,
      details: {
        oldAssigneeId: existing.assigneeId,
        newAssigneeId: dto.assigneeId,
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Soft-delete a task and resync lead next-action
   */
  async remove(id: string, user: AuthenticatedUser): Promise<{ message: string }> {
    const existing = await this.prisma.task.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    if (
      user.role === 'BDE_SALES' &&
      existing.assigneeId !== user.userId &&
      existing.creatorId !== user.userId
    ) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }

    await this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    if (existing.leadId) {
      await this.syncLeadNextAction(existing.leadId, user.organizationId);
    }

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'TASK_DELETED',
      resource: 'tasks',
      resourceId: id,
      details: {},
    });

    return { message: 'Task deleted successfully' };
  }
}
