import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateCustomerDto, CustomerStatusEnum } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { CustomerResponseDto, PaginatedCustomersResponseDto } from './dto/customer-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private mapToResponseDto(c: any): CustomerResponseDto {
    return {
      id: c.id,
      organizationId: c.organizationId,
      leadId: c.leadId,
      dealId: c.dealId,
      companyName: c.companyName,
      contactName: c.contactName,
      title: c.title,
      phone: c.phone,
      email: c.email,
      address: c.address,
      city: c.city,
      state: c.state,
      postalCode: c.postalCode,
      country: c.country,
      status: c.status,
      ownerId: c.ownerId,
      customerSince: c.customerSince,
      notes: c.notes,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      owner: c.owner
        ? { id: c.owner.id, name: c.owner.name, email: c.owner.email }
        : undefined,
      lead: c.lead
        ? { id: c.lead.id, fullName: c.lead.fullName }
        : undefined,
      deal: c.deal
        ? { id: c.deal.id, title: c.deal.title, value: Number(c.deal.value) }
        : undefined,
    };
  }

  async findAll(
    query: CustomerQueryDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedCustomersResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      organizationId: user.organizationId,
      deletedAt: null,
    };

    if (user.role === 'BDE_SALES') {
      where.ownerId = user.userId;
    } else if (query.ownerId) {
      where.ownerId = query.ownerId;
    }

    if (query.status) where.status = query.status;
    if (query.companyName) {
      where.companyName = { contains: query.companyName, mode: 'insensitive' };
    }

    if (query.customerSinceFrom || query.customerSinceTo) {
      where.customerSince = {
        ...(where.customerSince && typeof where.customerSince === 'object' ? where.customerSince : {}),
        ...(query.customerSinceFrom ? { gte: new Date(query.customerSinceFrom) } : {}),
        ...(query.customerSinceTo ? { lte: new Date(query.customerSinceTo) } : {}),
      };
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { companyName: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
        { contactName: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
        { email: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
        { phone: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
      ];
    }

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {};
    const sortField = query.sortBy || 'customerSince';
    const sortDirection = query.sortOrder || 'desc';
    orderBy[sortField] = sortDirection;

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, fullName: true } },
          deal: { select: { id: true, title: true, value: true } },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers.map((c) => this.mapToResponseDto(c)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findById(id: string, user: AuthenticatedUser): Promise<CustomerResponseDto> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, fullName: true } },
        deal: { select: { id: true, title: true, value: true } },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    if (user.role === 'BDE_SALES' && customer.ownerId !== user.userId) {
      throw new ForbiddenException('You do not have permission to view this customer');
    }

    return this.mapToResponseDto(customer);
  }

  async create(dto: CreateCustomerDto, user: AuthenticatedUser): Promise<CustomerResponseDto> {
    // Check duplicate by email within organization
    const existingEmail = await this.prisma.customer.findFirst({
      where: {
        organizationId: user.organizationId,
        email: dto.email,
        deletedAt: null,
      },
    });
    if (existingEmail) {
      throw new ConflictException(`A customer with email ${dto.email} already exists in this organization`);
    }

    if (dto.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: { id: dto.leadId, organizationId: user.organizationId, deletedAt: null },
      });
      if (!lead) throw new BadRequestException(`Source lead ${dto.leadId} not found`);
    }

    if (dto.dealId) {
      const deal = await this.prisma.deal.findFirst({
        where: { id: dto.dealId, organizationId: user.organizationId, deletedAt: null },
      });
      if (!deal) throw new BadRequestException(`Associated deal ${dto.dealId} not found`);
    }

    let targetOwnerId = user.userId;
    if (dto.ownerId) {
      if (user.role === 'BDE_SALES' && dto.ownerId !== user.userId) {
        throw new ForbiddenException('BDE sales representatives can only manage accounts assigned to themselves');
      }
      const ownerUser = await this.prisma.user.findFirst({
        where: { id: dto.ownerId, organizationId: user.organizationId, status: 'ACTIVE' },
      });
      if (!ownerUser) throw new BadRequestException('Target account manager user not found or inactive');
      targetOwnerId = dto.ownerId;
    }

    // Verify mandatory source lead
    const lead = await this.prisma.lead.findFirst({
      where: { id: dto.leadId, organizationId: user.organizationId, deletedAt: null },
    });
    if (!lead) throw new BadRequestException('Associated originating lead not found or inactive');

    const customer = await this.prisma.customer.create({
      data: {
        organizationId: user.organizationId,
        ownerId: targetOwnerId,
        leadId: dto.leadId,
        dealId: dto.dealId || null,
        companyName: dto.companyName,
        contactName: dto.contactName,
        title: dto.title || null,
        phone: dto.phone,
        email: dto.email,
        address: dto.address || null,
        city: dto.city || null,
        state: dto.state || null,
        postalCode: dto.postalCode || null,
        country: dto.country || 'India',
        status: dto.status || CustomerStatusEnum.ACTIVE,
        customerSince: dto.customerSince ? new Date(dto.customerSince) : new Date(),
        notes: dto.notes || null,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, fullName: true } },
        deal: { select: { id: true, title: true, value: true } },
      },
    });

    // Advance source lead status to CONVERTED
    await this.prisma.lead.update({
      where: { id: dto.leadId },
      data: { status: 'CONVERTED', lastActivityAt: new Date() },
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'CUSTOMER_CREATED',
      resource: 'customers',
      resourceId: customer.id,
      details: {
        companyName: customer.companyName,
        contactName: customer.contactName,
        email: customer.email,
        leadId: customer.leadId,
        dealId: customer.dealId,
      },
    });

    return this.mapToResponseDto(customer);
  }

  async update(id: string, dto: UpdateCustomerDto, user: AuthenticatedUser): Promise<CustomerResponseDto> {
    const existing = await this.prisma.customer.findFirst({
      where: { id, organizationId: user.organizationId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException(`Customer ${id} not found`);

    if (user.role === 'BDE_SALES' && existing.ownerId !== user.userId) {
      throw new ForbiddenException('You do not have permission to edit this customer');
    }

    if (dto.email && dto.email !== existing.email) {
      const duplicate = await this.prisma.customer.findFirst({
        where: {
          organizationId: user.organizationId,
          email: dto.email,
          deletedAt: null,
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new ConflictException(`A customer with email ${dto.email} already exists`);
      }
    }

    if (dto.ownerId && dto.ownerId !== existing.ownerId) {
      if (user.role === 'BDE_SALES') {
        throw new ForbiddenException('BDE sales representatives cannot reassign customer accounts');
      }
      const ownerUser = await this.prisma.user.findFirst({
        where: { id: dto.ownerId, organizationId: user.organizationId, status: 'ACTIVE' },
      });
      if (!ownerUser) throw new BadRequestException('Target account manager not found or inactive');
    }

    const updateData: Prisma.CustomerUpdateInput = {};
    if (dto.companyName !== undefined) updateData.companyName = dto.companyName;
    if (dto.contactName !== undefined) updateData.contactName = dto.contactName;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.state !== undefined) updateData.state = dto.state;
    if (dto.postalCode !== undefined) updateData.postalCode = dto.postalCode;
    if (dto.country !== undefined) updateData.country = dto.country;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.customerSince !== undefined) updateData.customerSince = new Date(dto.customerSince);
    if (dto.ownerId !== undefined) {
      updateData.owner = { connect: { id: dto.ownerId } };
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, fullName: true } },
        deal: { select: { id: true, title: true, value: true } },
      },
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'CUSTOMER_UPDATED',
      resource: 'customers',
      resourceId: updated.id,
      details: { companyName: updated.companyName, status: updated.status },
    });

    return this.mapToResponseDto(updated);
  }

  async remove(id: string, user: AuthenticatedUser): Promise<{ message: string }> {
    const existing = await this.prisma.customer.findFirst({
      where: { id, organizationId: user.organizationId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException(`Customer ${id} not found`);

    if (user.role === 'BDE_SALES') {
      throw new ForbiddenException('Only ADMIN and MANAGER can delete customers');
    }

    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'CUSTOMER_DELETED',
      resource: 'customers',
      resourceId: id,
      details: {},
    });

    return { message: 'Customer deleted successfully' };
  }
}
