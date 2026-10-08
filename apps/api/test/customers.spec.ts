import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { CustomersService } from '../src/modules/customers/customers.service';
import { CustomersController } from '../src/modules/customers/customers.controller';
import { PrismaService } from '../src/database/prisma.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { AuthenticatedUser } from '../src/common/decorators/current-user.decorator';
import { CustomerStatusEnum } from '../src/modules/customers/dto/create-customer.dto';

describe('B2.7 Customers Unit & Integration Suite', () => {
  let service: CustomersService;
  let controller: CustomersController;
  let prisma: any;
  let auditService: any;

  const mockAdmin: AuthenticatedUser = {
    userId: 'user-admin-1',
    email: 'admin@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'ADMIN',
    permissions: ['customers:read', 'customers:create', 'customers:update', 'customers:delete'],
  };

  const mockBde: AuthenticatedUser = {
    userId: 'user-bde-1',
    email: 'bde@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'BDE_SALES',
    permissions: ['customers:read', 'customers:create', 'customers:update'],
  };

  const mockOtherBde: AuthenticatedUser = {
    userId: 'user-bde-2',
    email: 'otherbde@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'BDE_SALES',
    permissions: ['customers:read', 'customers:create', 'customers:update'],
  };

  const sampleCustomer = {
    id: 'cust-uuid-1',
    organizationId: 'org-tenant-1',
    leadId: 'lead-uuid-1',
    dealId: 'deal-uuid-1',
    companyName: 'Acme Technologies Pvt Ltd',
    contactName: 'Rohan Sharma',
    title: 'CTO',
    phone: '+919876543210',
    email: 'rohan@acme.com',
    address: 'Sector 62',
    city: 'Noida',
    state: 'Uttar Pradesh',
    postalCode: '201301',
    country: 'India',
    status: 'ACTIVE',
    ownerId: 'user-bde-1',
    customerSince: new Date('2026-10-07T10:00:00Z'),
    notes: 'Premium enterprise account',
    deletedAt: null,
    createdAt: new Date('2026-10-07T10:00:00Z'),
    updatedAt: new Date('2026-10-07T10:00:00Z'),
    owner: { id: 'user-bde-1', name: 'Arjun BDE', email: 'bde@digitechzo.com' },
    lead: { id: 'lead-uuid-1', fullName: 'Rohan Sharma' },
    deal: { id: 'deal-uuid-1', title: 'Enterprise Cloud', value: 500000 },
  };

  beforeEach(async () => {
    prisma = {
      customer: {
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
    };

    auditService = {
      record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    controller = module.get<CustomersController>(CustomersController);
  });

  describe('Customer Creation & Lead Conversion', () => {
    it('creates customer, advances source lead status to CONVERTED without deleting lead', async () => {
      prisma.customer.findFirst.mockResolvedValue(null); // No duplicate
      prisma.lead.findFirst.mockResolvedValue({ id: 'lead-uuid-1', organizationId: 'org-tenant-1' });
      prisma.customer.create.mockResolvedValue(sampleCustomer);
      prisma.lead.update.mockResolvedValue({});

      const result = await service.create(
        {
          companyName: 'Acme Technologies Pvt Ltd',
          contactName: 'Rohan Sharma',
          phone: '+919876543210',
          email: 'rohan@acme.com',
          leadId: 'lead-uuid-1',
        },
        mockBde,
      );

      expect(result.id).toBe('cust-uuid-1');
      expect(prisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lead-uuid-1' },
          data: expect.objectContaining({ status: 'CONVERTED' }),
        }),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CUSTOMER_CREATED',
          organizationId: 'org-tenant-1',
        }),
      );
    });

    it('rejects creation when duplicate customer email exists in organization', async () => {
      prisma.customer.findFirst.mockResolvedValue(sampleCustomer); // duplicate exists

      await expect(
        service.create(
          {
            companyName: 'Duplicate Corp',
            contactName: 'Rohan Sharma',
            phone: '+919876543210',
            email: 'rohan@acme.com',
            leadId: 'lead-uuid-1',
          },
          mockBde,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Scoping & Tenant Boundary', () => {
    it('BDE sees only owned customers', async () => {
      prisma.customer.findMany.mockResolvedValue([sampleCustomer]);
      prisma.customer.count.mockResolvedValue(1);

      const res = await service.findAll({}, mockBde);

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-tenant-1',
            ownerId: 'user-bde-1',
          }),
        }),
      );
      expect(res.data).toHaveLength(1);
    });

    it('Admin can view all customers across organization', async () => {
      prisma.customer.findMany.mockResolvedValue([sampleCustomer]);
      prisma.customer.count.mockResolvedValue(1);

      await service.findAll({}, mockAdmin);

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-tenant-1',
          }),
        }),
      );
    });

    it('BDE cannot view customer owned by another BDE', async () => {
      prisma.customer.findFirst.mockResolvedValue(sampleCustomer);

      await expect(service.findById('cust-uuid-1', mockOtherBde)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Customer Updates & Deletion Governance', () => {
    it('updates customer details successfully', async () => {
      prisma.customer.findFirst.mockResolvedValue(sampleCustomer);
      prisma.customer.update.mockResolvedValue({
        ...sampleCustomer,
        title: 'VP of Technology',
      });

      const res = await service.update('cust-uuid-1', { title: 'VP of Technology' }, mockBde);
      expect(res.title).toBe('VP of Technology');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CUSTOMER_UPDATED' }),
      );
    });

    it('BDE cannot delete customer accounts', async () => {
      prisma.customer.findFirst.mockResolvedValue(sampleCustomer);

      await expect(service.remove('cust-uuid-1', mockBde)).rejects.toThrow(ForbiddenException);
    });

    it('Admin can soft-delete customer account', async () => {
      prisma.customer.findFirst.mockResolvedValue(sampleCustomer);
      prisma.customer.update.mockResolvedValue({
        ...sampleCustomer,
        deletedAt: new Date(),
      });

      const res = await service.remove('cust-uuid-1', mockAdmin);
      expect(res.message).toBe('Customer deleted successfully');
      expect(prisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cust-uuid-1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });
  });
});
