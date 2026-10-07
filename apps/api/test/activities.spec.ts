import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ActivitiesService } from '../src/modules/activities/activities.service';
import { ActivitiesController } from '../src/modules/activities/activities.controller';
import { PrismaService } from '../src/database/prisma.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { AuthenticatedUser } from '../src/common/decorators/current-user.decorator';
import { ActivityTypeEnum, ActivityDirectionEnum } from '../src/modules/activities/dto/create-activity.dto';

describe('B2.4 Activities / Communication Timeline Unit & Integration Suite', () => {
  let service: ActivitiesService;
  let controller: ActivitiesController;
  let prisma: any;
  let auditService: any;

  const mockAdmin: AuthenticatedUser = {
    userId: 'user-admin-1',
    email: 'admin@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'ADMIN',
    permissions: ['activities:read', 'activities:create', 'activities:update', 'activities:delete'],
  };

  const mockBde: AuthenticatedUser = {
    userId: 'user-bde-1',
    email: 'bde@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'BDE_SALES',
    permissions: ['activities:read', 'activities:create'],
  };

  const sampleActivity = {
    id: 'activity-uuid-1',
    organizationId: 'org-tenant-1',
    userId: 'user-bde-1',
    leadId: 'lead-uuid-1',
    dealId: null,
    taskId: null,
    activityType: 'CALL',
    direction: 'OUTBOUND',
    subject: 'Discovery Call with Client VP',
    description: 'Detailed requirements gathered. Next step is quotation.',
    activityDate: new Date('2026-10-07T11:00:00Z'),
    durationSeconds: 900,
    outcome: 'CONNECTED',
    metadata: { channel: 'telephony', callDisposition: 'interested' },
    createdAt: new Date('2026-10-07T11:15:00Z'),
    updatedAt: new Date('2026-10-07T11:15:00Z'),
    user: { id: 'user-bde-1', name: 'Arjun BDE', email: 'bde@digitechzo.com' },
    lead: { id: 'lead-uuid-1', fullName: 'Rohan Sharma', companyName: 'Acme Corp', ownerId: 'user-bde-1' },
    deal: null,
    task: null,
  };

  beforeEach(async () => {
    prisma = {
      activity: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      lead: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      deal: {
        findFirst: jest.fn(),
      },
      task: {
        findFirst: jest.fn(),
      },
    };

    auditService = {
      record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [
        ActivitiesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    controller = module.get<ActivitiesController>(ActivitiesController);
  });

  describe('Timeline Listing & Scoping', () => {
    it('BDE sees activities created by self or linked to owned leads/deals', async () => {
      prisma.activity.findMany.mockResolvedValue([sampleActivity]);
      prisma.activity.count.mockResolvedValue(1);

      const res = await service.findAll({}, mockBde);

      expect(prisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-tenant-1',
            OR: [
              { userId: 'user-bde-1' },
              { lead: { ownerId: 'user-bde-1' } },
              { deal: { ownerId: 'user-bde-1' } },
            ],
          }),
        }),
      );
      expect(res.data).toHaveLength(1);
    });

    it('Admin can view all organization activities across users', async () => {
      prisma.activity.findMany.mockResolvedValue([sampleActivity]);
      prisma.activity.count.mockResolvedValue(1);

      await service.findAll({}, mockAdmin);

      expect(prisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-tenant-1',
          }),
        }),
      );
    });
  });

  describe('Activity Logging & Lead Last-Activity Synchronization', () => {
    it('logs an outbound call and updates Lead.lastActivityAt', async () => {
      prisma.lead.findFirst.mockResolvedValue({
        id: 'lead-uuid-1',
        organizationId: 'org-tenant-1',
        ownerId: 'user-bde-1',
      });
      prisma.activity.create.mockResolvedValue(sampleActivity);
      prisma.lead.update.mockResolvedValue({});

      const result = await service.create(
        {
          activityType: ActivityTypeEnum.CALL,
          direction: ActivityDirectionEnum.OUTBOUND,
          subject: 'Discovery Call with Client VP',
          description: 'Detailed requirements gathered.',
          leadId: 'lead-uuid-1',
          durationSeconds: 900,
          outcome: 'CONNECTED',
        },
        mockBde,
      );

      expect(result.id).toBe('activity-uuid-1');
      expect(prisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lead-uuid-1' },
          data: expect.objectContaining({
            lastActivityAt: expect.any(Date),
          }),
        }),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ACTIVITY_CREATED',
          organizationId: 'org-tenant-1',
        }),
      );
    });

    it('BDE cannot log activity on a lead owned by someone else', async () => {
      prisma.lead.findFirst.mockResolvedValue({
        id: 'lead-uuid-999',
        organizationId: 'org-tenant-1',
        ownerId: 'another-bde-uuid',
      });

      await expect(
        service.create(
          {
            activityType: ActivityTypeEnum.NOTE,
            subject: 'Unauthorized note',
            leadId: 'lead-uuid-999',
          },
          mockBde,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
