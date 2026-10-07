import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { MeetingsService } from '../src/modules/meetings/meetings.service';
import { MeetingsController } from '../src/modules/meetings/meetings.controller';
import { PrismaService } from '../src/database/prisma.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { AuthenticatedUser } from '../src/common/decorators/current-user.decorator';
import { MeetingTypeEnum, MeetingStatusEnum } from '../src/modules/meetings/dto/create-meeting.dto';

describe('B2.5 Meetings / Demos Unit & Integration Suite', () => {
  let service: MeetingsService;
  let controller: MeetingsController;
  let prisma: any;
  let auditService: any;

  const mockAdmin: AuthenticatedUser = {
    userId: 'user-admin-1',
    email: 'admin@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'ADMIN',
    permissions: ['meetings:read', 'meetings:create', 'meetings:update', 'meetings:delete'],
  };

  const mockBde: AuthenticatedUser = {
    userId: 'user-bde-1',
    email: 'bde@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'BDE_SALES',
    permissions: ['meetings:read', 'meetings:create', 'meetings:update'],
  };

  const mockOtherBde: AuthenticatedUser = {
    userId: 'user-bde-2',
    email: 'otherbde@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'BDE_SALES',
    permissions: ['meetings:read', 'meetings:create', 'meetings:update'],
  };

  const sampleMeeting = {
    id: 'meeting-uuid-1',
    organizationId: 'org-tenant-1',
    leadId: 'lead-uuid-1',
    dealId: 'deal-uuid-1',
    title: 'Product Architecture Demo',
    description: 'Walkthrough of cloud integration',
    meetingType: 'DEMO',
    startTime: new Date('2026-10-18T10:00:00.000Z'),
    endTime: new Date('2026-10-18T11:00:00.000Z'),
    location: 'https://meet.google.com/demo-test',
    ownerId: 'user-bde-1',
    creatorId: 'user-bde-1',
    status: 'SCHEDULED',
    outcome: null,
    notes: null,
    completedAt: null,
    cancelledAt: null,
    cancelReason: null,
    deletedAt: null,
    createdAt: new Date('2026-10-07T10:00:00Z'),
    updatedAt: new Date('2026-10-07T10:00:00Z'),
    owner: { id: 'user-bde-1', name: 'Arjun BDE', email: 'bde@digitechzo.com' },
    creator: { id: 'user-bde-1', name: 'Arjun BDE', email: 'bde@digitechzo.com' },
    lead: { id: 'lead-uuid-1', fullName: 'Rohan Sharma', companyName: 'Acme Corp' },
    deal: { id: 'deal-uuid-1', title: 'Enterprise Cloud' },
  };

  beforeEach(async () => {
    prisma = {
      meeting: {
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
      controllers: [MeetingsController],
      providers: [
        MeetingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<MeetingsService>(MeetingsService);
    controller = module.get<MeetingsController>(MeetingsController);
  });

  describe('Tenant Boundary & Scoping', () => {
    it('BDE listing is scoped to own meetings', async () => {
      prisma.meeting.findMany.mockResolvedValue([sampleMeeting]);
      prisma.meeting.count.mockResolvedValue(1);

      const res = await service.findAll({}, mockBde);

      expect(prisma.meeting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-tenant-1',
            OR: [
              { ownerId: 'user-bde-1' },
              { creatorId: 'user-bde-1' },
            ],
          }),
        }),
      );
      expect(res.data).toHaveLength(1);
    });

    it('Admin can view all organization meetings', async () => {
      prisma.meeting.findMany.mockResolvedValue([sampleMeeting]);
      prisma.meeting.count.mockResolvedValue(1);

      await service.findAll({}, mockAdmin);

      expect(prisma.meeting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-tenant-1',
          }),
        }),
      );
    });

    it('BDE cannot view meeting owned by another BDE', async () => {
      prisma.meeting.findFirst.mockResolvedValue(sampleMeeting);

      await expect(service.findById('meeting-uuid-1', mockOtherBde)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Meeting Creation & Schedule Validation', () => {
    it('creates meeting successfully and records audit log', async () => {
      prisma.lead.findFirst.mockResolvedValue({ id: 'lead-uuid-1', organizationId: 'org-tenant-1' });
      prisma.meeting.create.mockResolvedValue(sampleMeeting);
      prisma.lead.update.mockResolvedValue({});

      const result = await service.create(
        {
          title: 'Product Architecture Demo',
          meetingType: MeetingTypeEnum.DEMO,
          startTime: '2026-10-18T10:00:00.000Z',
          endTime: '2026-10-18T11:00:00.000Z',
          leadId: 'lead-uuid-1',
        },
        mockBde,
      );

      expect(result.id).toBe('meeting-uuid-1');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MEETING_SCHEDULED',
          organizationId: 'org-tenant-1',
        }),
      );
    });

    it('rejects meeting creation if endTime <= startTime', async () => {
      await expect(
        service.create(
          {
            title: 'Invalid Time Meeting',
            meetingType: MeetingTypeEnum.MEETING,
            startTime: '2026-10-18T11:00:00.000Z',
            endTime: '2026-10-18T10:00:00.000Z',
          },
          mockBde,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Lifecycle Actions: Complete, Cancel, No-Show', () => {
    it('completes meeting, creates activity and updates lead lastActivityAt', async () => {
      prisma.meeting.findFirst.mockResolvedValue(sampleMeeting);
      prisma.meeting.update.mockResolvedValue({
        ...sampleMeeting,
        status: 'COMPLETED',
        completedAt: new Date(),
        outcome: 'DEMO_SUCCESSFUL',
      });
      prisma.activity.create.mockResolvedValue({});
      prisma.lead.update.mockResolvedValue({});

      const res = await service.complete(
        'meeting-uuid-1',
        { outcome: 'DEMO_SUCCESSFUL', notes: 'Great engagement from team' },
        mockBde,
      );

      expect(res.status).toBe('COMPLETED');
      expect(prisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            meetingId: 'meeting-uuid-1',
            activityType: 'MEETING',
          }),
        }),
      );
      expect(prisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lead-uuid-1' },
          data: expect.objectContaining({ lastActivityAt: expect.any(Date) }),
        }),
      );
    });

    it('cancels meeting with reason and creates activity log', async () => {
      prisma.meeting.findFirst.mockResolvedValue(sampleMeeting);
      prisma.meeting.update.mockResolvedValue({
        ...sampleMeeting,
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: 'Client rescheduled',
      });
      prisma.activity.create.mockResolvedValue({});

      const res = await service.cancel(
        'meeting-uuid-1',
        { cancelReason: 'Client rescheduled' },
        mockBde,
      );

      expect(res.status).toBe('CANCELLED');
      expect(prisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            meetingId: 'meeting-uuid-1',
            outcome: 'CANCELLED',
          }),
        }),
      );
    });

    it('marks meeting as no-show and creates activity log', async () => {
      prisma.meeting.findFirst.mockResolvedValue(sampleMeeting);
      prisma.meeting.update.mockResolvedValue({
        ...sampleMeeting,
        status: 'NO_SHOW',
        outcome: 'NO_SHOW',
      });
      prisma.activity.create.mockResolvedValue({});

      const res = await service.markNoShow('meeting-uuid-1', mockBde);
      expect(res.status).toBe('NO_SHOW');
      expect(prisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            outcome: 'NO_SHOW',
          }),
        }),
      );
    });
  });

  describe('Reassignment Governance', () => {
    it('BDE cannot reassign a meeting host', async () => {
      await expect(
        service.assign('meeting-uuid-1', { ownerId: 'user-bde-2' }, mockBde),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Admin can reassign a meeting host to active org user', async () => {
      prisma.meeting.findFirst.mockResolvedValue(sampleMeeting);
      prisma.user.findFirst.mockResolvedValue({ id: 'user-bde-2', status: 'ACTIVE' });
      prisma.meeting.update.mockResolvedValue({ ...sampleMeeting, ownerId: 'user-bde-2' });

      const res = await service.assign('meeting-uuid-1', { ownerId: 'user-bde-2' }, mockAdmin);
      expect(res.ownerId).toBe('user-bde-2');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MEETING_REASSIGNED' }),
      );
    });
  });
});
