// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DealsService } from '../src/modules/deals/deals.service';
import { DealsController } from '../src/modules/deals/deals.controller';
import { PrismaService } from '../src/database/prisma.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { AuthenticatedUser } from '../src/common/decorators/current-user.decorator';

describe('B2.2 Deals / Pipeline Unit & Integration Suite', () => {
  let service: DealsService;
  let controller: DealsController;
  let prisma: any;
  let auditService: any;

  const mockAdmin: AuthenticatedUser = {
    userId: 'user-admin-1',
    email: 'admin@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'ADMIN',
    permissions: ['deals:read', 'deals:create', 'deals:update', 'deals:delete'],
  };

  const mockManager: AuthenticatedUser = {
    userId: 'user-manager-1',
    email: 'manager@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'MANAGER',
    permissions: ['deals:read', 'deals:create', 'deals:update'],
  };

  const mockBde: AuthenticatedUser = {
    userId: 'user-bde-1',
    email: 'bde@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'BDE_SALES',
    permissions: ['deals:read', 'deals:create', 'deals:update'],
  };

  const mockOtherBde: AuthenticatedUser = {
    userId: 'user-bde-2',
    email: 'otherbde@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'BDE_SALES',
    permissions: ['deals:read', 'deals:create', 'deals:update'],
  };

  const sampleDeal = {
    id: 'deal-uuid-1',
    organizationId: 'org-tenant-1',
    ownerId: 'user-bde-1',
    leadId: 'lead-uuid-1',
    stageId: 'stage-uuid-lead-in',
    title: 'Enterprise ERP Modernization',
    value: 500000,
    expectedCloseDate: new Date('2026-12-31'),
    probability: 60,
    status: 'OPEN',
    lostReasonId: null,
    lostReasonNotes: null,
    closedAt: null,
    wonNotes: null,
    deletedAt: null,
    createdAt: new Date('2026-10-07T10:00:00Z'),
    updatedAt: new Date('2026-10-07T10:00:00Z'),
    owner: { id: 'user-bde-1', name: 'Arjun BDE', email: 'bde@digitechzo.com' },
    stage: { id: 'stage-uuid-lead-in', name: 'Lead-In', order: 1, stageType: 'OPEN' },
    lead: { id: 'lead-uuid-1', fullName: 'Rohan Sharma' },
    lostReason: null,
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb) => (typeof cb === 'function' ? cb(prisma) : cb)),
      deal: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      customer: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      pipelineStage: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      lead: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      lostReason: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-log-1' }),
      },
    };

    auditService = {
      record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      recordTx: jest.fn().mockResolvedValue({ id: 'audit-tx-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DealsController],
      providers: [
        DealsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<DealsService>(DealsService);
    controller = module.get<DealsController>(DealsController);
  });

  describe('Tenant Boundary & BDE Scoping', () => {
    it('BDE listing is automatically scoped to user.userId', async () => {
      prisma.deal.findMany.mockResolvedValue([sampleDeal]);
      prisma.deal.count.mockResolvedValue(1);

      const res = await service.findAll({}, mockBde);

      expect(prisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-tenant-1',
            ownerId: 'user-bde-1',
          }),
        }),
      );
      expect(res.items).toHaveLength(1);
    });

    it('Admin can view all organization deals', async () => {
      prisma.deal.findMany.mockResolvedValue([sampleDeal]);
      prisma.deal.count.mockResolvedValue(1);

      const res = await service.findAll({}, mockAdmin);

      expect(prisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-tenant-1',
          }),
        }),
      );
      expect(res.items).toHaveLength(1);
    });

    it('BDE cannot access a deal owned by another BDE', async () => {
      prisma.deal.findFirst.mockResolvedValue(sampleDeal); // owned by user-bde-1

      await expect(service.findOne('deal-uuid-1', mockOtherBde)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Deal Creation & Validation', () => {
    it('creates a deal successfully when stage exists', async () => {
      prisma.pipelineStage.findUnique.mockResolvedValue({
        id: 'stage-uuid-lead-in',
        name: 'Lead-In',
        stageType: 'OPEN',
      });
      prisma.lead.findFirst.mockResolvedValue({ id: 'lead-uuid-1', organizationId: 'org-tenant-1' });
      prisma.deal.create.mockResolvedValue(sampleDeal);
      prisma.lead.update.mockResolvedValue({});

      const result = await service.create(
        {
          title: 'Enterprise ERP Modernization',
          stageId: 'stage-uuid-lead-in',
          leadId: 'lead-uuid-1',
          value: 500000,
        },
        mockBde,
      );

      expect(result.id).toBe('deal-uuid-1');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DEAL_CREATED',
          organizationId: 'org-tenant-1',
        }),
      );
    });

    it('fails deal creation if stage does not exist', async () => {
      prisma.pipelineStage.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            title: 'Enterprise ERP Modernization',
            stageId: 'invalid-stage',
            leadId: 'lead-uuid-1',
            value: 100000,
          },
          mockBde,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Stage Progression & Won/Lost Governance', () => {
    const mockLead = {
      id: 'lead-uuid-1',
      organizationId: 'org-tenant-1',
      fullName: 'Rohan Sharma',
      companyName: 'Sharma Enterprises',
      phone: '+919876543210',
      email: 'rohan@example.com',
      title: 'Director',
      status: 'IN_PROGRESS',
      deletedAt: null,
    };

    it('marks a deal WON, converts Lead to CONVERTED, and creates a new Customer', async () => {
      prisma.deal.findFirst.mockResolvedValue(sampleDeal);
      prisma.lead.findFirst.mockResolvedValue(mockLead);
      prisma.customer.findFirst.mockResolvedValue(null);
      prisma.pipelineStage.findFirst.mockResolvedValue({
        id: 'stage-uuid-won',
        name: 'Closed Won',
        stageType: 'WON',
      });
      prisma.deal.update.mockResolvedValue({
        ...sampleDeal,
        status: 'WON',
        wonNotes: 'Contract signed for 12 months',
        closedAt: new Date(),
        probability: 100,
      });
      prisma.customer.create.mockResolvedValue({
        id: 'cust-uuid-1',
        organizationId: 'org-tenant-1',
        companyName: 'Sharma Enterprises',
        contactName: 'Rohan Sharma',
        leadId: 'lead-uuid-1',
        dealId: 'deal-uuid-1',
        status: 'ACTIVE',
      });

      const updated = await service.markWon(
        'deal-uuid-1',
        { wonNotes: 'Contract signed for 12 months' },
        mockBde,
      );

      expect(updated.status).toBe('WON');
      expect(prisma.deal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'deal-uuid-1' },
          data: expect.objectContaining({
            status: 'WON',
            probability: 100,
          }),
        }),
      );
      expect(prisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lead-uuid-1' },
          data: expect.objectContaining({
            status: 'CONVERTED',
          }),
        }),
      );
      expect(prisma.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-tenant-1',
            leadId: 'lead-uuid-1',
            dealId: 'deal-uuid-1',
            companyName: 'Sharma Enterprises',
            contactName: 'Rohan Sharma',
            status: 'ACTIVE',
          }),
        }),
      );
      expect(auditService.recordTx).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ action: 'DEAL_WON' }),
      );
      expect(auditService.recordTx).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ action: 'LEAD_STATUS_CHANGED' }),
      );
      expect(auditService.recordTx).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ action: 'CUSTOMER_CREATED' }),
      );
    });

    it('marks a deal WON and safely reuses existing Customer without creating duplicates', async () => {
      prisma.deal.findFirst.mockResolvedValue(sampleDeal);
      prisma.lead.findFirst.mockResolvedValue({ ...mockLead, status: 'CONVERTED' });
      prisma.customer.findFirst.mockResolvedValue({
        id: 'cust-existing-1',
        organizationId: 'org-tenant-1',
        companyName: 'Sharma Enterprises',
        contactName: 'Rohan Sharma',
        leadId: 'lead-uuid-1',
        dealId: 'old-deal-1',
        status: 'ACTIVE',
        notes: 'Original account notes',
      });
      prisma.pipelineStage.findFirst.mockResolvedValue({
        id: 'stage-uuid-won',
        name: 'Closed Won',
        stageType: 'WON',
      });
      prisma.deal.update.mockResolvedValue({
        ...sampleDeal,
        status: 'WON',
        wonNotes: 'Upsell contract signed',
        closedAt: new Date(),
        probability: 100,
      });
      prisma.customer.update.mockResolvedValue({
        id: 'cust-existing-1',
        dealId: 'deal-uuid-1',
        status: 'ACTIVE',
      });

      const updated = await service.markWon(
        'deal-uuid-1',
        { wonNotes: 'Upsell contract signed' },
        mockBde,
      );

      expect(updated.status).toBe('WON');
      expect(prisma.customer.create).not.toHaveBeenCalled();
      expect(prisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cust-existing-1' },
          data: expect.objectContaining({
            dealId: 'deal-uuid-1',
            status: 'ACTIVE',
          }),
        }),
      );
    });

    it('marks a deal LOST, requires valid lost reason, and marks Lead LOST when no other open deals exist', async () => {
      prisma.deal.findFirst.mockResolvedValue(sampleDeal);
      prisma.lead.findFirst.mockResolvedValue(mockLead);
      prisma.deal.count.mockResolvedValue(0); // 0 other open deals
      prisma.lostReason.findUnique.mockResolvedValue({
        id: 'reason-price',
        code: 'COMPETITOR_PRICE',
        isActive: true,
      });
      prisma.pipelineStage.findFirst.mockResolvedValue({
        id: 'stage-uuid-lost',
        name: 'Closed Lost',
        stageType: 'LOST',
      });
      prisma.deal.update.mockResolvedValue({
        ...sampleDeal,
        status: 'LOST',
        lostReasonId: 'reason-price',
        closedAt: new Date(),
        probability: 0,
      });

      const updated = await service.markLost(
        'deal-uuid-1',
        { lostReasonId: 'reason-price', lostReasonNotes: 'Budget constraints' },
        mockBde,
      );

      expect(updated.status).toBe('LOST');
      expect(prisma.deal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'deal-uuid-1' },
          data: expect.objectContaining({
            status: 'LOST',
            lostReasonId: 'reason-price',
            probability: 0,
          }),
        }),
      );
      expect(prisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lead-uuid-1' },
          data: expect.objectContaining({
            status: 'LOST',
          }),
        }),
      );
      expect(auditService.recordTx).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ action: 'DEAL_LOST' }),
      );
      expect(auditService.recordTx).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ action: 'LEAD_STATUS_CHANGED' }),
      );
    });

    it('marks a deal LOST but preserves Lead status if Lead has other OPEN deals', async () => {
      prisma.deal.findFirst.mockResolvedValue(sampleDeal);
      prisma.lead.findFirst.mockResolvedValue(mockLead);
      prisma.deal.count.mockResolvedValue(1); // 1 other open deal
      prisma.lostReason.findUnique.mockResolvedValue({
        id: 'reason-price',
        code: 'COMPETITOR_PRICE',
        isActive: true,
      });
      prisma.pipelineStage.findFirst.mockResolvedValue({
        id: 'stage-uuid-lost',
        name: 'Closed Lost',
        stageType: 'LOST',
      });
      prisma.deal.update.mockResolvedValue({
        ...sampleDeal,
        status: 'LOST',
        lostReasonId: 'reason-price',
        closedAt: new Date(),
        probability: 0,
      });

      const updated = await service.markLost(
        'deal-uuid-1',
        { lostReasonId: 'reason-price', lostReasonNotes: 'Budget constraints' },
        mockBde,
      );

      expect(updated.status).toBe('LOST');
      expect(prisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lead-uuid-1' },
          data: expect.not.objectContaining({
            status: 'LOST',
          }),
        }),
      );
    });

    it('marks a deal LOST but preserves Lead status if Lead is already CONVERTED', async () => {
      prisma.deal.findFirst.mockResolvedValue(sampleDeal);
      prisma.lead.findFirst.mockResolvedValue({ ...mockLead, status: 'CONVERTED' });
      prisma.deal.count.mockResolvedValue(0);
      prisma.lostReason.findUnique.mockResolvedValue({
        id: 'reason-price',
        code: 'COMPETITOR_PRICE',
        isActive: true,
      });
      prisma.pipelineStage.findFirst.mockResolvedValue({
        id: 'stage-uuid-lost',
        name: 'Closed Lost',
        stageType: 'LOST',
      });
      prisma.deal.update.mockResolvedValue({
        ...sampleDeal,
        status: 'LOST',
        lostReasonId: 'reason-price',
        closedAt: new Date(),
        probability: 0,
      });

      const updated = await service.markLost(
        'deal-uuid-1',
        { lostReasonId: 'reason-price', lostReasonNotes: 'Secondary pitch rejected' },
        mockBde,
      );

      expect(updated.status).toBe('LOST');
      expect(prisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lead-uuid-1' },
          data: expect.not.objectContaining({
            status: 'LOST',
          }),
        }),
      );
    });

    it('BDE is forbidden from reassigning a deal', async () => {
      await expect(
        service.assign('deal-uuid-1', { ownerId: 'user-bde-2' }, mockBde),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Admin can reassign a deal to a user within the organization', async () => {
      prisma.deal.findFirst.mockResolvedValue(sampleDeal);
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-bde-2',
        organizationId: 'org-tenant-1',
        status: 'ACTIVE',
      });
      prisma.deal.update.mockResolvedValue({
        ...sampleDeal,
        ownerId: 'user-bde-2',
      });

      const updated = await service.assign('deal-uuid-1', { ownerId: 'user-bde-2' }, mockAdmin);
      expect(updated.ownerId).toBe('user-bde-2');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DEAL_REASSIGNED' }),
      );
    });
  });

  describe('Soft Deletion', () => {
    it('marks deal deleted without dropping rows', async () => {
      prisma.deal.findFirst.mockResolvedValue(sampleDeal);
      prisma.deal.update.mockResolvedValue({ ...sampleDeal, deletedAt: new Date() });

      const res = await service.softDelete('deal-uuid-1', mockAdmin);
      expect(res.message).toBe('Deal soft-deleted successfully');
      expect(prisma.deal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'deal-uuid-1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe('Pipeline Reference Data', () => {
    it('returns pipeline stages sorted by order ascending', async () => {
      const mockStages = [
        { id: 'stage-1', name: 'Qualification', order: 1, stageType: 'OPEN', dealCountBenchmark: 5, totalValueBenchmark: 100000 },
        { id: 'stage-2', name: 'Discovery', order: 2, stageType: 'OPEN', dealCountBenchmark: 3, totalValueBenchmark: 80000 },
      ];
      prisma.pipelineStage.findMany.mockResolvedValue(mockStages);

      const stages = await service.getStages();
      expect(stages).toHaveLength(2);
      expect(stages[0].name).toBe('Qualification');
      expect(stages[0].order).toBe(1);
      expect(prisma.pipelineStage.findMany).toHaveBeenCalledWith({
        orderBy: { order: 'asc' },
      });
    });

    it('returns only active lost reasons', async () => {
      const mockReasons = [
        { id: 'reason-1', code: 'PRICE_TOO_HIGH', label: 'Price too high', isActive: true },
        { id: 'reason-2', code: 'POOR_FIT', label: 'Requirements poor fit', isActive: true },
      ];
      prisma.lostReason.findMany.mockResolvedValue(mockReasons);

      const reasons = await service.getLostReasons();
      expect(reasons).toHaveLength(2);
      expect(reasons[0].code).toBe('PRICE_TOO_HIGH');
      expect(prisma.lostReason.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { code: 'asc' },
      });
    });
  });
});

