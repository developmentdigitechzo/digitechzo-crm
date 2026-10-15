// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TasksService } from '../src/modules/tasks/tasks.service';
import { TasksController } from '../src/modules/tasks/tasks.controller';
import { PrismaService } from '../src/database/prisma.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { AuthenticatedUser } from '../src/common/decorators/current-user.decorator';
import { TaskTypeEnum, TaskPriorityEnum } from '../src/modules/tasks/dto/create-task.dto';

describe('B2.3 Tasks / Follow-ups Unit & Integration Suite', () => {
  let service: TasksService;
  let controller: TasksController;
  let prisma: any;
  let auditService: any;

  const mockAdmin: AuthenticatedUser = {
    userId: 'user-admin-1',
    email: 'admin@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'ADMIN',
    permissions: ['tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete'],
  };

  const mockBde: AuthenticatedUser = {
    userId: 'user-bde-1',
    email: 'bde@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'BDE_SALES',
    permissions: ['tasks:read', 'tasks:create', 'tasks:update'],
  };

  const mockOtherBde: AuthenticatedUser = {
    userId: 'user-bde-2',
    email: 'otherbde@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'BDE_SALES',
    permissions: ['tasks:read', 'tasks:create', 'tasks:update'],
  };

  const sampleTask = {
    id: 'task-uuid-1',
    organizationId: 'org-tenant-1',
    assigneeId: 'user-bde-1',
    creatorId: 'user-bde-1',
    leadId: 'lead-uuid-1',
    dealId: null,
    taskType: 'FOLLOW_UP',
    title: 'Follow up after proposal submission',
    description: 'Check if CTO has reviewed pricing section',
    dueDate: new Date('2026-10-18T10:00:00.000Z'),
    priority: 'HIGH',
    status: 'PENDING',
    completedAt: null,
    completionNotes: null,
    deletedAt: null,
    createdAt: new Date('2026-10-07T10:00:00Z'),
    updatedAt: new Date('2026-10-07T10:00:00Z'),
    assignee: { id: 'user-bde-1', name: 'Arjun BDE', email: 'bde@digitechzo.com' },
    creator: { id: 'user-bde-1', name: 'Arjun BDE', email: 'bde@digitechzo.com' },
    lead: { id: 'lead-uuid-1', fullName: 'Rohan Sharma', companyName: 'Acme Corp' },
    deal: null,
  };

  beforeEach(async () => {
    prisma = {
      task: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      lead: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      deal: {
        findFirst: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      activity: {
        create: jest.fn(),
      },
    };

    auditService = {
      record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        TasksService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    controller = module.get<TasksController>(TasksController);
  });

  describe('Tenant Isolation & Ownership Scoping', () => {
    it('BDE sees only assigned or created tasks', async () => {
      prisma.task.findMany.mockResolvedValue([sampleTask]);
      prisma.task.count.mockResolvedValue(1);

      const res = await service.findAll({}, mockBde);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-tenant-1',
            deletedAt: null,
            OR: [
              { assigneeId: 'user-bde-1' },
              { creatorId: 'user-bde-1' },
            ],
          }),
        }),
      );
      expect(res.data).toHaveLength(1);
    });

    it('Admin can view all tasks across the organization', async () => {
      prisma.task.findMany.mockResolvedValue([sampleTask]);
      prisma.task.count.mockResolvedValue(1);

      await service.findAll({}, mockAdmin);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-tenant-1',
            deletedAt: null,
          }),
        }),
      );
    });

    it('Overdue tasks filter queries tasks with dueDate in past and status pending/in_progress', async () => {
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(0);

      await service.findAll({ overdue: true }, mockAdmin);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            dueDate: expect.objectContaining({ lt: expect.any(Date) }),
          }),
        }),
      );
    });
  });

  describe('Task Creation & Lead Next-Action Synchronization', () => {
    it('creates a task and syncs Lead nextAction snapshot', async () => {
      prisma.lead.findFirst.mockResolvedValue({ id: 'lead-uuid-1', organizationId: 'org-tenant-1' });
      prisma.task.create.mockResolvedValue(sampleTask);
      prisma.task.findFirst.mockResolvedValue(sampleTask); // for syncLeadNextAction
      prisma.lead.update.mockResolvedValue({});

      const result = await service.create(
        {
          title: 'Follow up after proposal submission',
          dueDate: '2026-10-18T10:00:00.000Z',
          taskType: TaskTypeEnum.FOLLOW_UP,
          leadId: 'lead-uuid-1',
          priority: TaskPriorityEnum.HIGH,
        },
        mockBde,
      );

      expect(result.id).toBe('task-uuid-1');
      expect(prisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lead-uuid-1' },
          data: expect.objectContaining({
            nextActionPurpose: 'Follow up after proposal submission',
            nextActionOwnerId: 'user-bde-1',
          }),
        }),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TASK_CREATED',
          organizationId: 'org-tenant-1',
        }),
      );
    });

    it('BDE cannot assign task to another user on creation', async () => {
      await expect(
        service.create(
          {
            title: 'Unauthorized Task',
            dueDate: '2026-10-18T10:00:00.000Z',
            taskType: TaskTypeEnum.CALL,
            assigneeId: 'user-bde-2',
          },
          mockBde,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Task Completion, Activity Log, and Reopen', () => {
    it('completes task, logs activity, and refreshes lead next-action', async () => {
      prisma.task.findFirst
        .mockResolvedValueOnce(sampleTask) // check existing
        .mockResolvedValueOnce(null); // sync: no more pending tasks
      prisma.task.update.mockResolvedValue({
        ...sampleTask,
        status: 'COMPLETED',
        completedAt: new Date(),
        completionNotes: 'Client agreed to demo next Tuesday',
      });
      prisma.activity.create.mockResolvedValue({});
      prisma.lead.update.mockResolvedValue({});

      const result = await service.complete(
        'task-uuid-1',
        { completionNotes: 'Client agreed to demo next Tuesday', createActivity: true },
        mockBde,
      );

      expect(result.status).toBe('COMPLETED');
      expect(prisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            taskId: 'task-uuid-1',
            leadId: 'lead-uuid-1',
            subject: 'Task Completed: Follow up after proposal submission',
          }),
        }),
      );
      // Lead snapshot cleared since no more pending tasks
      expect(prisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lead-uuid-1' },
          data: expect.objectContaining({
            nextActionDueAt: null,
            nextActionPurpose: null,
          }),
        }),
      );
    });

    it('reopens task back to pending', async () => {
      prisma.task.findFirst
        .mockResolvedValueOnce({ ...sampleTask, status: 'COMPLETED', completedAt: new Date() })
        .mockResolvedValueOnce(sampleTask);
      prisma.task.update.mockResolvedValue({
        ...sampleTask,
        status: 'PENDING',
        completedAt: null,
        completionNotes: null,
      });
      prisma.lead.update.mockResolvedValue({});

      const result = await service.reopen('task-uuid-1', mockBde);
      expect(result.status).toBe('PENDING');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'TASK_REOPENED' }),
      );
    });
  });

  describe('Task Assignment Governance', () => {
    it('BDE cannot reassign a task', async () => {
      await expect(
        service.assign('task-uuid-1', { assigneeId: 'user-bde-2' }, mockBde),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Admin can reassign task to active user in same org', async () => {
      prisma.task.findFirst.mockResolvedValue(sampleTask);
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-bde-2',
        organizationId: 'org-tenant-1',
        status: 'ACTIVE',
      });
      prisma.task.update.mockResolvedValue({
        ...sampleTask,
        assigneeId: 'user-bde-2',
      });
      prisma.lead.update.mockResolvedValue({});

      const result = await service.assign('task-uuid-1', { assigneeId: 'user-bde-2' }, mockAdmin);
      expect(result.assigneeId).toBe('user-bde-2');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'TASK_REASSIGNED' }),
      );
    });
  });
});

