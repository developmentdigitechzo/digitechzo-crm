// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ProposalsService } from '../src/modules/proposals/proposals.service';
import { ProposalsController } from '../src/modules/proposals/proposals.controller';
import { PrismaService } from '../src/database/prisma.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { AuthenticatedUser } from '../src/common/decorators/current-user.decorator';
import { ProposalStatusEnum } from '../src/modules/proposals/dto/create-proposal.dto';

describe('B2.6 Proposals / Quotes Unit & Integration Suite', () => {
  let service: ProposalsService;
  let controller: ProposalsController;
  let prisma: any;
  let auditService: any;

  const mockAdmin: AuthenticatedUser = {
    userId: 'user-admin-1',
    email: 'admin@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'ADMIN',
    permissions: ['proposals:read', 'proposals:create', 'proposals:update', 'proposals:delete'],
  };

  const mockBde: AuthenticatedUser = {
    userId: 'user-bde-1',
    email: 'bde@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'BDE_SALES',
    permissions: ['proposals:read', 'proposals:create', 'proposals:update'],
  };

  const mockOtherBde: AuthenticatedUser = {
    userId: 'user-bde-2',
    email: 'otherbde@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'BDE_SALES',
    permissions: ['proposals:read', 'proposals:create', 'proposals:update'],
  };

  const sampleProposal = {
    id: 'prop-uuid-1',
    organizationId: 'org-tenant-1',
    leadId: 'lead-uuid-1',
    dealId: 'deal-uuid-1',
    proposalNumber: 'PROP-202610-0001',
    title: 'Enterprise ERP Implementation',
    description: 'Phase 1 & Phase 2 rollout',
    subtotal: 500000,
    discountAmount: 50000,
    taxAmount: 81000,
    totalAmount: 531000,
    currency: 'INR',
    validUntil: new Date('2026-11-30T23:59:59.000Z'),
    status: 'DRAFT',
    ownerId: 'user-bde-1',
    creatorId: 'user-bde-1',
    sentAt: null,
    acceptedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    notes: 'Includes 1 year support',
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
      proposal: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      lead: {
        findFirst: jest.fn(),
      },
      deal: {
        findFirst: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
    };

    auditService = {
      record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProposalsController],
      providers: [
        ProposalsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<ProposalsService>(ProposalsService);
    controller = module.get<ProposalsController>(ProposalsController);
  });

  describe('Proposal Creation & Pricing Calculation', () => {
    it('creates proposal, computes total amount and assigns proposalNumber', async () => {
      prisma.lead.findFirst.mockResolvedValue({ id: 'lead-uuid-1', organizationId: 'org-tenant-1' });
      prisma.proposal.count.mockResolvedValue(0);
      prisma.proposal.create.mockResolvedValue(sampleProposal);

      const result = await service.create(
        {
          title: 'Enterprise ERP Implementation',
          subtotal: 500000,
          discountAmount: 50000,
          taxAmount: 81000,
          leadId: 'lead-uuid-1',
        },
        mockBde,
      );

      expect(result.id).toBe('prop-uuid-1');
      expect(result.proposalNumber).toBe('PROP-202610-0001');
      expect(prisma.proposal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 531000,
            status: 'DRAFT',
          }),
        }),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PROPOSAL_CREATED',
          organizationId: 'org-tenant-1',
        }),
      );
    });
  });

  describe('Scoping & Tenant Boundary', () => {
    it('BDE sees only assigned/created proposals', async () => {
      prisma.proposal.findMany.mockResolvedValue([sampleProposal]);
      prisma.proposal.count.mockResolvedValue(1);

      const res = await service.findAll({}, mockBde);

      expect(prisma.proposal.findMany).toHaveBeenCalledWith(
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

    it('Admin can view all proposals in organization', async () => {
      prisma.proposal.findMany.mockResolvedValue([sampleProposal]);
      prisma.proposal.count.mockResolvedValue(1);

      await service.findAll({}, mockAdmin);

      expect(prisma.proposal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-tenant-1',
          }),
        }),
      );
    });

    it('BDE cannot view proposal of another BDE', async () => {
      prisma.proposal.findFirst.mockResolvedValue(sampleProposal);

      await expect(service.findById('prop-uuid-1', mockOtherBde)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Status Transitions: SENT, ACCEPTED, REJECTED', () => {
    it('transitions to SENT and sets sentAt', async () => {
      prisma.proposal.findFirst.mockResolvedValue(sampleProposal);
      prisma.proposal.update.mockResolvedValue({
        ...sampleProposal,
        status: 'SENT',
        sentAt: new Date(),
      });

      const res = await service.updateStatus('prop-uuid-1', { status: ProposalStatusEnum.SENT }, mockBde);
      expect(res.status).toBe('SENT');
      expect(prisma.proposal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'SENT',
            sentAt: expect.any(Date),
          }),
        }),
      );
    });

    it('transitions to ACCEPTED and sets acceptedAt', async () => {
      prisma.proposal.findFirst.mockResolvedValue({ ...sampleProposal, status: 'SENT' });
      prisma.proposal.update.mockResolvedValue({
        ...sampleProposal,
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      });

      const res = await service.updateStatus('prop-uuid-1', { status: ProposalStatusEnum.ACCEPTED }, mockBde);
      expect(res.status).toBe('ACCEPTED');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PROPOSAL_STATUS_ACCEPTED' }),
      );
    });

    it('transitions to REJECTED and records rejectionReason', async () => {
      prisma.proposal.findFirst.mockResolvedValue({ ...sampleProposal, status: 'SENT' });
      prisma.proposal.update.mockResolvedValue({
        ...sampleProposal,
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: 'Exceeded procurement budget limit',
      });

      const res = await service.updateStatus(
        'prop-uuid-1',
        { status: ProposalStatusEnum.REJECTED, rejectionReason: 'Exceeded procurement budget limit' },
        mockBde,
      );
      expect(res.status).toBe('REJECTED');
      expect(res.rejectionReason).toBe('Exceeded procurement budget limit');
    });

    it('cannot update proposal fields once accepted', async () => {
      prisma.proposal.findFirst.mockResolvedValue({ ...sampleProposal, status: 'ACCEPTED' });

      await expect(
        service.update('prop-uuid-1', { subtotal: 600000 }, mockBde),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

