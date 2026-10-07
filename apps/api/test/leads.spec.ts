import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { LeadsService } from '../src/modules/leads/leads.service';
import { LeadsController } from '../src/modules/leads/leads.controller';
import { PrismaService } from '../src/database/prisma.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { AuthenticatedUser } from '../src/common/decorators/current-user.decorator';
import {
  LeadSourceEnum,
  LeadPriorityEnum,
  LeadTemperatureEnum,
} from '../src/modules/leads/dto/create-lead.dto';
import {
  LeadStatusEnum,
  UnqualifiedReasonEnum,
} from '../src/modules/leads/dto/update-lead-status.dto';

describe('B2.1 Lead Management Unit & Integration Suite', () => {
  let service: LeadsService;
  let controller: LeadsController;
  let prisma: any;
  let auditService: any;

  const mockAdminUser: AuthenticatedUser = {
    userId: 'user-admin-1',
    email: 'admin@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'ADMIN',
    permissions: ['leads:read', 'leads:create', 'leads:update', 'leads:delete'],
  };

  const mockManagerUser: AuthenticatedUser = {
    userId: 'user-manager-1',
    email: 'manager@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'MANAGER',
    permissions: ['leads:read', 'leads:create', 'leads:update'],
  };

  const mockBdeUser: AuthenticatedUser = {
    userId: 'user-bde-1',
    email: 'arjun@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'BDE_SALES',
    permissions: ['leads:read', 'leads:create', 'leads:update'],
  };

  const mockOtherTenantUser: AuthenticatedUser = {
    userId: 'user-other-tenant',
    email: 'other@competitor.com',
    organizationId: 'org-tenant-999',
    role: 'ADMIN',
    permissions: ['leads:read', 'leads:create', 'leads:update', 'leads:delete'],
  };

  const sampleLead = {
    id: 'lead-uuid-1',
    organizationId: 'org-tenant-1',
    ownerId: 'user-bde-1',
    fullName: 'Rohan Sharma',
    companyName: 'Acme Logistics',
    title: 'CTO',
    phone: '+919876543210',
    email: 'rohan@acmelogistics.com',
    source: 'WEBSITE_FORM',
    status: 'NEW',
    priority: 'MEDIUM',
    temperature: 'WARM',
    leadScore: 75,
    serviceInterest: 'Custom Web Application',
    unqualifiedReason: null,
    unqualifiedNotes: null,
    nextActionDueAt: new Date('2026-10-15T10:00:00.000Z'),
    nextActionType: 'CALL',
    nextActionPurpose: 'Discovery consultation',
    nextActionOwnerId: 'user-bde-1',
    deletedAt: null,
    createdAt: new Date('2026-10-07T10:00:00.000Z'),
    updatedAt: new Date('2026-10-07T10:00:00.000Z'),
    lastActivityAt: new Date('2026-10-07T10:00:00.000Z'),
    owner: {
      id: 'user-bde-1',
      name: 'Arjun Verma',
      email: 'arjun@digitechzo.com',
    },
    qualification: null,
  };

  beforeEach(async () => {
    prisma = {
      lead: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      leadQualification: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };

    auditService = {
      record: jest.fn().mockResolvedValue({ id: 'audit-log-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadsController],
      providers: [
        LeadsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    controller = module.get<LeadsController>(LeadsController);
  });

  describe('1. Creation & Deduplication', () => {
    it('should create a valid lead, defaulting status to NEW and priority to MEDIUM', async () => {
      prisma.lead.findFirst.mockResolvedValue(null);
      prisma.lead.create.mockResolvedValue(sampleLead);

      const result = await service.create(
        {
          fullName: 'Rohan Sharma',
          phone: '+919876543210',
          email: 'rohan@acmelogistics.com',
          source: LeadSourceEnum.WEBSITE_FORM,
          serviceInterest: 'Custom Web Application',
        },
        mockBdeUser,
      );

      expect(prisma.lead.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: mockBdeUser.organizationId,
          deletedAt: null,
          OR: [{ phone: '+919876543210' }, { email: 'rohan@acmelogistics.com' }],
        },
      });

      expect(prisma.lead.create).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LEAD_CREATED',
          organizationId: mockBdeUser.organizationId,
        }),
      );
      expect(result.fullName).toBe('Rohan Sharma');
      expect(result.status).toBe('NEW');
      expect(result.priority).toBe('MEDIUM');
      expect(result.ownerName).toBe('Arjun Verma');
    });

    it('should throw ConflictException (HTTP 409) if active duplicate phone or email exists in same tenant', async () => {
      prisma.lead.findFirst.mockResolvedValue(sampleLead);

      await expect(
        service.create(
          {
            fullName: 'Duplicate Contact',
            phone: '+919876543210',
            email: 'duplicate@acmelogistics.com',
            source: LeadSourceEnum.MANUAL,
            serviceInterest: 'SEO',
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(ConflictException);

      expect(prisma.lead.create).not.toHaveBeenCalled();
    });

    it('should allow Admin to assign lead to another user within the same organization', async () => {
      prisma.lead.findFirst.mockResolvedValue(null);
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-rep-2',
        organizationId: mockAdminUser.organizationId,
        status: 'ACTIVE',
      });
      prisma.lead.create.mockResolvedValue({
        ...sampleLead,
        ownerId: 'user-rep-2',
        owner: { id: 'user-rep-2', name: 'Priya Sharma', email: 'priya@digitechzo.com' },
      });

      const result = await service.create(
        {
          fullName: 'New Assigned Prospect',
          phone: '+919876543211',
          email: 'new@prospect.com',
          source: LeadSourceEnum.GOOGLE_ADS,
          serviceInterest: 'Mobile App',
          ownerId: 'user-rep-2',
        },
        mockAdminUser,
      );

      expect(result.ownerId).toBe('user-rep-2');
      expect(result.ownerName).toBe('Priya Sharma');
    });

    it('should force BDE_SALES to be the owner regardless of dto.ownerId', async () => {
      prisma.lead.findFirst.mockResolvedValue(null);
      prisma.lead.create.mockResolvedValue(sampleLead);

      await service.create(
        {
          fullName: 'BDE Prospect',
          phone: '+919876543212',
          email: 'bde@prospect.com',
          source: LeadSourceEnum.MANUAL,
          serviceInterest: 'CRM',
          ownerId: 'user-someone-else',
        },
        mockBdeUser,
      );

      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerId: mockBdeUser.userId,
          }),
        }),
      );
    });
  });

  describe('2. Scoped Visibility & Tenant Isolation', () => {
    it('should scope BDE_SALES to only view assigned leads', async () => {
      prisma.lead.count.mockResolvedValue(1);
      prisma.lead.findMany.mockResolvedValue([sampleLead]);

      await service.findAll({}, mockBdeUser);

      expect(prisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: mockBdeUser.organizationId,
            ownerId: mockBdeUser.userId,
            deletedAt: null,
          }),
        }),
      );
    });

    it('should give ADMIN organization-wide visibility across all leads', async () => {
      prisma.lead.count.mockResolvedValue(10);
      prisma.lead.findMany.mockResolvedValue([sampleLead]);

      await service.findAll({}, mockAdminUser);

      expect(prisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: mockAdminUser.organizationId,
            deletedAt: null,
          }),
        }),
      );
      // ownerId should NOT be restricted to admin's userId
      const where = prisma.lead.findMany.mock.calls[0][0].where;
      expect(where.ownerId).toBeUndefined();
    });

    it('should throw NotFoundException if BDE attempts to access another rep lead by ID', async () => {
      prisma.lead.findFirst.mockResolvedValue({
        ...sampleLead,
        ownerId: 'user-different-rep',
      });

      await expect(service.findOne('lead-uuid-1', mockBdeUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user in Org A queries lead in Org B', async () => {
      prisma.lead.findFirst.mockResolvedValue(null);

      await expect(service.findOne('lead-uuid-1', mockOtherTenantUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('3. Reassignment Governance', () => {
    it('should allow ADMIN and MANAGER to reassign lead and record audit log', async () => {
      prisma.lead.findFirst.mockResolvedValue(sampleLead);
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-rep-2',
        organizationId: mockManagerUser.organizationId,
        status: 'ACTIVE',
      });
      prisma.lead.update.mockResolvedValue({
        ...sampleLead,
        ownerId: 'user-rep-2',
        owner: { id: 'user-rep-2', name: 'Priya Sharma', email: 'priya@digitechzo.com' },
      });

      const result = await service.assign(
        'lead-uuid-1',
        { ownerId: 'user-rep-2' },
        mockManagerUser,
      );

      expect(result.ownerId).toBe('user-rep-2');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LEAD_REASSIGNED',
          details: expect.objectContaining({
            previousOwnerId: 'user-bde-1',
            newOwnerId: 'user-rep-2',
            reassignedBy: mockManagerUser.userId,
          }),
        }),
      );
    });

    it('should throw ForbiddenException if BDE attempts to reassign lead', async () => {
      await expect(
        service.assign('lead-uuid-1', { ownerId: 'user-rep-2' }, mockBdeUser),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.lead.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if target user is inactive or from another org', async () => {
      prisma.lead.findFirst.mockResolvedValue(sampleLead);
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.assign('lead-uuid-1', { ownerId: 'user-invalid' }, mockAdminUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. Status Transitions & Unqualification Governance', () => {
    it('should transition status to CONTACTED', async () => {
      prisma.lead.findFirst.mockResolvedValue(sampleLead);
      prisma.lead.update.mockResolvedValue({
        ...sampleLead,
        status: 'CONTACTED',
      });

      const result = await service.updateStatus(
        'lead-uuid-1',
        { status: LeadStatusEnum.CONTACTED },
        mockBdeUser,
      );

      expect(result.status).toBe('CONTACTED');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LEAD_STATUS_CHANGED',
          details: expect.objectContaining({
            previousStatus: 'NEW',
            newStatus: 'CONTACTED',
          }),
        }),
      );
    });

    it('should transition to UNQUALIFIED with required unqualifiedReason', async () => {
      prisma.lead.findFirst.mockResolvedValue(sampleLead);
      prisma.lead.update.mockResolvedValue({
        ...sampleLead,
        status: 'UNQUALIFIED',
        unqualifiedReason: 'PRICE_TOO_HIGH',
        unqualifiedNotes: 'Prospect budget is insufficient',
      });

      const result = await service.updateStatus(
        'lead-uuid-1',
        {
          status: LeadStatusEnum.UNQUALIFIED,
          unqualifiedReason: UnqualifiedReasonEnum.PRICE_TOO_HIGH,
          unqualifiedNotes: 'Prospect budget is insufficient',
        },
        mockBdeUser,
      );

      expect(result.status).toBe('UNQUALIFIED');
      expect(result.unqualifiedReason).toBe('PRICE_TOO_HIGH');
    });

    it('should throw BadRequestException if UNQUALIFIED status has no unqualifiedReason', async () => {
      prisma.lead.findFirst.mockResolvedValue(sampleLead);

      await expect(
        service.updateStatus(
          'lead-uuid-1',
          { status: LeadStatusEnum.UNQUALIFIED },
          mockBdeUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('5. BANT Qualification Criteria', () => {
    it('should upsert BANT qualification criteria and touch lead lastActivityAt', async () => {
      prisma.lead.findFirst.mockResolvedValue(sampleLead);
      const mockQual = {
        id: 'qual-1',
        leadId: 'lead-uuid-1',
        budgetAmount: 500000,
        budgetStatus: 'CONFIRMED',
        authorityLevel: 'DECISION_MAKER',
        timelineHorizon: 'IMMEDIATE_2WEEKS',
        urgencyRating: 5,
        problemStatement: 'Need enterprise CRM system in 30 days',
        notes: 'Founder approved expenditure',
        qualifiedByUserId: mockBdeUser.userId,
        qualifiedAt: new Date('2026-10-07T11:00:00.000Z'),
        updatedAt: new Date('2026-10-07T11:00:00.000Z'),
      };
      prisma.leadQualification.upsert.mockResolvedValue(mockQual);
      prisma.lead.update.mockResolvedValue(sampleLead);

      const result = await service.upsertQualification(
        'lead-uuid-1',
        {
          budgetAmount: 500000,
          budgetStatus: 'CONFIRMED' as any,
          authorityLevel: 'DECISION_MAKER' as any,
          timelineHorizon: 'IMMEDIATE_2WEEKS' as any,
          urgencyRating: 5,
          problemStatement: 'Need enterprise CRM system in 30 days',
          notes: 'Founder approved expenditure',
        },
        mockBdeUser,
      );

      expect(result.budgetAmount).toBe(500000);
      expect(result.authorityLevel).toBe('DECISION_MAKER');
      expect(prisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lead-uuid-1' },
          data: { lastActivityAt: expect.any(Date) },
        }),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LEAD_QUALIFIED',
          resource: 'leads',
          resourceId: 'lead-uuid-1',
        }),
      );
    });
  });

  describe('6. Next Action Snapshot & Priority Updates', () => {
    it('should update next action snapshot and record audit log', async () => {
      prisma.lead.findFirst.mockResolvedValue(sampleLead);
      const updatedMock = {
        ...sampleLead,
        nextActionDueAt: new Date('2026-10-20T10:00:00.000Z'),
        nextActionType: 'EMAIL',
        nextActionPurpose: 'Send revised commercial proposal',
      };
      prisma.lead.update.mockResolvedValue(updatedMock);

      const result = await service.updateNextAction(
        'lead-uuid-1',
        {
          nextActionDueAt: '2026-10-20T10:00:00.000Z',
          nextActionType: 'EMAIL' as any,
          nextActionPurpose: 'Send revised commercial proposal',
        },
        mockBdeUser,
      );

      expect(prisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lead-uuid-1' },
          data: expect.objectContaining({
            nextActionType: 'EMAIL',
            nextActionPurpose: 'Send revised commercial proposal',
            nextActionOwnerId: mockBdeUser.userId,
          }),
        }),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LEAD_NEXT_ACTION_UPDATED',
          resourceId: 'lead-uuid-1',
        }),
      );
      expect(result.nextAction?.type).toBe('EMAIL');
    });

    it('should update priority and temperature', async () => {
      prisma.lead.findFirst.mockResolvedValue(sampleLead);
      prisma.lead.update.mockResolvedValue({
        ...sampleLead,
        priority: 'URGENT',
        temperature: 'HOT',
      });

      const result = await service.updatePriorityTemperature(
        'lead-uuid-1',
        {
          priority: LeadPriorityEnum.URGENT,
          temperature: LeadTemperatureEnum.HOT,
        },
        mockBdeUser,
      );

      expect(prisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lead-uuid-1' },
          data: expect.objectContaining({
            priority: 'URGENT',
            temperature: 'HOT',
          }),
        }),
      );
      expect(result.priority).toBe('URGENT');
      expect(result.temperature).toBe('HOT');
    });
  });

  describe('7. Soft Deletion Governance', () => {
    it('should soft delete lead and record audit log', async () => {
      prisma.lead.findFirst.mockResolvedValue(sampleLead);
      prisma.lead.update.mockResolvedValue({
        ...sampleLead,
        deletedAt: new Date(),
      });

      const result = await service.softDelete('lead-uuid-1', mockAdminUser);

      expect(result.message).toContain('soft-deleted');
      expect(prisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lead-uuid-1' },
          data: { deletedAt: expect.any(Date) },
        }),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LEAD_DELETED',
          resourceId: 'lead-uuid-1',
        }),
      );
    });
  });

  describe('8. Controller Route Mapping', () => {
    it('should delegate controller.findAll to service.findAll', async () => {
      const spy = jest.spyOn(service, 'findAll').mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      await controller.findAll({}, mockAdminUser);
      expect(spy).toHaveBeenCalledWith({}, mockAdminUser);
    });

    it('should delegate controller.create to service.create', async () => {
      const dto = {
        fullName: 'Test Prospect',
        phone: '+919988776655',
        email: 'test@prospect.com',
        source: LeadSourceEnum.WEBSITE_FORM,
        serviceInterest: 'Audit',
      };
      const spy = jest.spyOn(service, 'create').mockResolvedValue({} as any);

      await controller.create(dto, mockAdminUser);
      expect(spy).toHaveBeenCalledWith(dto, mockAdminUser);
    });

    it('should delegate controller.updateNextAction to service.updateNextAction', async () => {
      const dto = {
        nextActionPurpose: 'Call client',
      };
      const spy = jest.spyOn(service, 'updateNextAction').mockResolvedValue({} as any);

      await controller.updateNextAction('lead-uuid-1', dto, mockAdminUser);
      expect(spy).toHaveBeenCalledWith('lead-uuid-1', dto, mockAdminUser);
    });

    it('should delegate controller.patchQualification to service.upsertQualification', async () => {
      const dto = {
        budgetAmount: 100000,
      };
      const spy = jest.spyOn(service, 'upsertQualification').mockResolvedValue({} as any);

      await controller.patchQualification('lead-uuid-1', dto, mockAdminUser);
      expect(spy).toHaveBeenCalledWith('lead-uuid-1', dto, mockAdminUser);
    });
  });
});
