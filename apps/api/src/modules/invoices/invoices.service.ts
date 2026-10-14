import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateInvoiceDto, InvoiceStatusEnum } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import {
  InvoiceResponseDto,
  PaginatedInvoicesResponseDto,
  InvoiceItemResponseDto,
} from './dto/invoice-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private mapItemToDto(item: any): InvoiceItemResponseDto {
    return {
      id: item.id,
      invoiceId: item.invoiceId,
      description: item.description,
      subdesc: item.subdesc || undefined,
      quantity: item.quantity,
      price: Number(item.price),
      advanceAmount: item.advanceAmount !== null && item.advanceAmount !== undefined ? Number(item.advanceAmount) : undefined,
      customValues: item.customValues || undefined,
      order: item.order,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private mapToResponseDto(inv: any): InvoiceResponseDto {
    return {
      id: inv.id,
      organizationId: inv.organizationId,
      invoiceNumber: inv.invoiceNumber,
      poNumber: inv.poNumber || undefined,
      clientName: inv.clientName,
      clientContact: inv.clientContact || undefined,
      clientEmail: inv.clientEmail || undefined,
      clientPhone: inv.clientPhone || undefined,
      clientAddress: inv.clientAddress || undefined,
      clientTaxId: inv.clientTaxId || undefined,
      leadId: inv.leadId || undefined,
      customerId: inv.customerId || undefined,
      creatorId: inv.creatorId || undefined,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      paymentTermsDays: inv.paymentTermsDays || undefined,
      status: inv.status,
      currency: inv.currency,
      subtotal: Number(inv.subtotal),
      taxRate: Number(inv.taxRate),
      taxAmount: Number(inv.taxAmount),
      discountRate: Number(inv.discountRate),
      discountAmount: Number(inv.discountAmount),
      total: Number(inv.total),
      advanceAmount: Number(inv.advanceAmount),
      amountPaid: Number(inv.amountPaid),
      balanceDue: Number(inv.balanceDue),
      notes: inv.notes || undefined,
      footerText: inv.footerText || undefined,
      senderProfile: inv.senderProfile || undefined,
      bankDetails: inv.bankDetails || undefined,
      upiDetails: inv.upiDetails || undefined,
      cryptoDetails: inv.cryptoDetails || undefined,
      signature: inv.signature || undefined,
      customColumns: inv.customColumns || undefined,
      columnConfig: inv.columnConfig || undefined,
      activeTheme: inv.activeTheme || undefined,
      rawData: inv.rawData || undefined,
      items: (inv.items || []).map((it: any) => this.mapItemToDto(it)),
      lead: inv.lead
        ? { id: inv.lead.id, fullName: inv.lead.fullName, companyName: inv.lead.companyName || undefined }
        : undefined,
      customer: inv.customer
        ? { id: inv.customer.id, companyName: inv.customer.companyName, contactName: inv.customer.contactName }
        : undefined,
      creator: inv.creator
        ? { id: inv.creator.id, name: inv.creator.name, email: inv.creator.email }
        : undefined,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
    };
  }

  private async generateInvoiceNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: { organizationId },
    });
    const seq = String(count + 1).padStart(3, '0');
    return `DIGI-${year}-${seq}`;
  }

  async findAll(
    query: InvoiceQueryDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedInvoicesResponseDto> {
    const {
      search,
      status,
      leadId,
      customerId,
      page = 1,
      limit = 25,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.InvoiceWhereInput = {
      organizationId: user.organizationId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }
    if (leadId) {
      where.leadId = leadId;
    }
    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientContact: { contains: search, mode: 'insensitive' } },
        { clientEmail: { contains: search, mode: 'insensitive' } },
        { clientPhone: { contains: search, mode: 'insensitive' } },
        { poNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const validSortFields = ['createdAt', 'issueDate', 'dueDate', 'total', 'status', 'invoiceNumber'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderBy: Prisma.InvoiceOrderByWithRelationInput = {
      [orderByField]: sortOrder,
    };

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
          lead: { select: { id: true, fullName: true, companyName: true } },
          customer: { select: { id: true, companyName: true, contactName: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      items: items.map((inv) => this.mapToResponseDto(inv)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string, user: AuthenticatedUser): Promise<InvoiceResponseDto> {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
        lead: { select: { id: true, fullName: true, companyName: true } },
        customer: { select: { id: true, companyName: true, contactName: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return this.mapToResponseDto(invoice);
  }

  async create(dto: CreateInvoiceDto, user: AuthenticatedUser): Promise<InvoiceResponseDto> {
    let invoiceNumber = dto.invoiceNumber?.trim();
    if (!invoiceNumber) {
      invoiceNumber = await this.generateInvoiceNumber(user.organizationId);
    }

    // Check uniqueness within the organization
    const existing = await this.prisma.invoice.findUnique({
      where: {
        organizationId_invoiceNumber: {
          organizationId: user.organizationId,
          invoiceNumber,
        },
      },
    });

    if (existing) {
      if (!existing.deletedAt) {
        // If it exists and not deleted, either update it or raise error.
        // If user explicitly saved an already-existing invoice number, update it!
        return this.update(existing.id, dto as UpdateInvoiceDto, user);
      } else {
        // Re-use invoice number by clearing deletedAt or appending
        invoiceNumber = `${invoiceNumber}-R`;
      }
    }

    // Resolve creatorId, ensuring valid relation within the organization
    let creatorId = user.userId;
    if (dto.creatorId) {
      const creatorExists = await this.prisma.user.findFirst({
        where: { id: dto.creatorId, organizationId: user.organizationId },
        select: { id: true },
      });
      if (creatorExists) {
        creatorId = creatorExists.id;
      }
    }

    // Resolve leadId safely
    let leadId: string | null = null;
    if (dto.leadId) {
      const leadExists = await this.prisma.lead.findFirst({
        where: { id: dto.leadId, organizationId: user.organizationId },
        select: { id: true },
      });
      if (leadExists) {
        leadId = leadExists.id;
      }
    }

    // Resolve customerId safely
    let customerId: string | null = null;
    if (dto.customerId) {
      const customerExists = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, organizationId: user.organizationId },
        select: { id: true },
      });
      if (customerExists) {
        customerId = customerExists.id;
      }
    }

    const rawData = dto.rawData
      ? { ...dto.rawData, ...(dto.notesHeading ? { notesHeading: dto.notesHeading } : {}) }
      : (dto.notesHeading ? { notesHeading: dto.notesHeading } : undefined);

    const created = await this.prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          organizationId: user.organizationId,
          creatorId,
          invoiceNumber,
          poNumber: dto.poNumber,
          clientName: dto.clientName,
          clientContact: dto.clientContact,
          clientEmail: dto.clientEmail,
          clientPhone: dto.clientPhone,
          clientAddress: dto.clientAddress,
          clientTaxId: dto.clientTaxId,
          leadId,
          customerId,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
          dueDate: new Date(dto.dueDate),
          paymentTermsDays: dto.paymentTermsDays || '15',
          status: dto.status || InvoiceStatusEnum.DRAFT,
          currency: dto.currency || '₹',
          subtotal: new Prisma.Decimal(dto.subtotal || 0),
          taxRate: new Prisma.Decimal(dto.taxRate || 0),
          taxAmount: new Prisma.Decimal(dto.taxAmount || 0),
          discountRate: new Prisma.Decimal(dto.discountRate || 0),
          discountAmount: new Prisma.Decimal(dto.discountAmount || 0),
          total: new Prisma.Decimal(dto.total || 0),
          advanceAmount: new Prisma.Decimal(dto.advanceAmount || 0),
          amountPaid: new Prisma.Decimal(dto.amountPaid || 0),
          balanceDue: new Prisma.Decimal(dto.balanceDue || 0),
          notes: dto.notes,
          footerText: dto.footerText,
          senderProfile: dto.senderProfile as any,
          bankDetails: dto.bankDetails as any,
          upiDetails: dto.upiDetails as any,
          cryptoDetails: dto.cryptoDetails as any,
          signature: dto.signature as any,
          customColumns: dto.customColumns as any,
          columnConfig: dto.columnConfig as any,
          activeTheme: dto.activeTheme as any,
          rawData: rawData as any,
          items: {
            create: (dto.items || []).map((it, idx) => ({
              description: it.description,
              subdesc: it.subdesc,
              quantity: it.quantity || 1,
              price: new Prisma.Decimal(it.price || 0),
              advanceAmount: it.advanceAmount !== undefined ? new Prisma.Decimal(it.advanceAmount) : null,
              customValues: it.customValues as any,
              order: it.order ?? idx,
            })),
          },
        },
        include: {
          items: { orderBy: { order: 'asc' } },
          lead: { select: { id: true, fullName: true, companyName: true } },
          customer: { select: { id: true, companyName: true, contactName: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      });

      return inv;
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'invoices:create',
      resource: 'invoices',
      resourceId: created.id,
      details: {
        invoiceNumber: created.invoiceNumber,
        clientName: created.clientName,
        total: Number(created.total),
      },
    });

    return this.mapToResponseDto(created);
  }

  async update(
    id: string,
    dto: UpdateInvoiceDto,
    user: AuthenticatedUser,
  ): Promise<InvoiceResponseDto> {
    const existing = await this.prisma.invoice.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // If items are provided in update, replace them
      if (dto.items) {
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: id },
        });

        await tx.invoiceItem.createMany({
          data: dto.items.map((it, idx) => ({
            invoiceId: id,
            description: it.description,
            subdesc: it.subdesc,
            quantity: it.quantity || 1,
            price: new Prisma.Decimal(it.price || 0),
            advanceAmount: it.advanceAmount !== undefined ? new Prisma.Decimal(it.advanceAmount) : null,
            customValues: it.customValues as any,
            order: it.order ?? idx,
          })),
        });
      }

      const updateData: Prisma.InvoiceUpdateInput = {};
      if (dto.invoiceNumber !== undefined) updateData.invoiceNumber = dto.invoiceNumber;
      if (dto.poNumber !== undefined) updateData.poNumber = dto.poNumber;
      if (dto.clientName !== undefined) updateData.clientName = dto.clientName;
      if (dto.clientContact !== undefined) updateData.clientContact = dto.clientContact;
      if (dto.clientEmail !== undefined) updateData.clientEmail = dto.clientEmail;
      if (dto.clientPhone !== undefined) updateData.clientPhone = dto.clientPhone;
      if (dto.clientAddress !== undefined) updateData.clientAddress = dto.clientAddress;
      if (dto.clientTaxId !== undefined) updateData.clientTaxId = dto.clientTaxId;
      if (dto.leadId !== undefined) {
        if (dto.leadId) {
          const leadExists = await this.prisma.lead.findFirst({
            where: { id: dto.leadId, organizationId: user.organizationId },
            select: { id: true },
          });
          updateData.lead = leadExists ? { connect: { id: leadExists.id } } : { disconnect: true };
        } else {
          updateData.lead = { disconnect: true };
        }
      }
      if (dto.customerId !== undefined) {
        if (dto.customerId) {
          const customerExists = await this.prisma.customer.findFirst({
            where: { id: dto.customerId, organizationId: user.organizationId },
            select: { id: true },
          });
          updateData.customer = customerExists ? { connect: { id: customerExists.id } } : { disconnect: true };
        } else {
          updateData.customer = { disconnect: true };
        }
      }
      if (dto.issueDate !== undefined) updateData.issueDate = new Date(dto.issueDate);
      if (dto.dueDate !== undefined) updateData.dueDate = new Date(dto.dueDate);
      if (dto.paymentTermsDays !== undefined) updateData.paymentTermsDays = dto.paymentTermsDays;
      if (dto.status !== undefined) updateData.status = dto.status;
      if (dto.currency !== undefined) updateData.currency = dto.currency;
      if (dto.subtotal !== undefined) updateData.subtotal = new Prisma.Decimal(dto.subtotal);
      if (dto.taxRate !== undefined) updateData.taxRate = new Prisma.Decimal(dto.taxRate);
      if (dto.taxAmount !== undefined) updateData.taxAmount = new Prisma.Decimal(dto.taxAmount);
      if (dto.discountRate !== undefined) updateData.discountRate = new Prisma.Decimal(dto.discountRate);
      if (dto.discountAmount !== undefined) updateData.discountAmount = new Prisma.Decimal(dto.discountAmount);
      if (dto.total !== undefined) updateData.total = new Prisma.Decimal(dto.total);
      if (dto.advanceAmount !== undefined) updateData.advanceAmount = new Prisma.Decimal(dto.advanceAmount);
      if (dto.amountPaid !== undefined) updateData.amountPaid = new Prisma.Decimal(dto.amountPaid);
      if (dto.balanceDue !== undefined) updateData.balanceDue = new Prisma.Decimal(dto.balanceDue);
      if (dto.notes !== undefined) updateData.notes = dto.notes;
      if (dto.footerText !== undefined) updateData.footerText = dto.footerText;
      if (dto.senderProfile !== undefined) updateData.senderProfile = dto.senderProfile as any;
      if (dto.bankDetails !== undefined) updateData.bankDetails = dto.bankDetails as any;
      if (dto.upiDetails !== undefined) updateData.upiDetails = dto.upiDetails as any;
      if (dto.cryptoDetails !== undefined) updateData.cryptoDetails = dto.cryptoDetails as any;
      if (dto.signature !== undefined) updateData.signature = dto.signature as any;
      if (dto.customColumns !== undefined) updateData.customColumns = dto.customColumns as any;
      if (dto.columnConfig !== undefined) updateData.columnConfig = dto.columnConfig as any;
      if (dto.activeTheme !== undefined) updateData.activeTheme = dto.activeTheme as any;
      if (dto.rawData !== undefined) {
        updateData.rawData = {
          ...dto.rawData,
          ...(dto.notesHeading ? { notesHeading: dto.notesHeading } : {}),
        } as any;
      } else if (dto.notesHeading !== undefined) {
        updateData.rawData = {
          ...((existing.rawData as object) || {}),
          notesHeading: dto.notesHeading,
        } as any;
      }

      const inv = await tx.invoice.update({
        where: { id },
        data: updateData,
        include: {
          items: { orderBy: { order: 'asc' } },
          lead: { select: { id: true, fullName: true, companyName: true } },
          customer: { select: { id: true, companyName: true, contactName: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      });

      return inv;
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'invoices:update',
      resource: 'invoices',
      resourceId: updated.id,
      details: {
        invoiceNumber: updated.invoiceNumber,
        status: updated.status,
      },
    });

    return this.mapToResponseDto(updated);
  }

  async updateStatus(
    id: string,
    dto: UpdateInvoiceStatusDto,
    user: AuthenticatedUser,
  ): Promise<InvoiceResponseDto> {
    const existing = await this.prisma.invoice.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: dto.status },
      include: {
        items: { orderBy: { order: 'asc' } },
        lead: { select: { id: true, fullName: true, companyName: true } },
        customer: { select: { id: true, companyName: true, contactName: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'invoices:update_status',
      resource: 'invoices',
      resourceId: updated.id,
      details: {
        oldStatus: existing.status,
        newStatus: dto.status,
      },
    });

    return this.mapToResponseDto(updated);
  }

  async delete(id: string, user: AuthenticatedUser): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.invoice.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Soft delete
    await this.prisma.invoice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'invoices:delete',
      resource: 'invoices',
      resourceId: id,
      details: {
        invoiceNumber: existing.invoiceNumber,
      },
    });

    return { success: true, message: `Invoice ${existing.invoiceNumber} deleted successfully` };
  }

  // Company Profile management
  async getCompanyProfile(user: AuthenticatedUser) {
    const profile = await this.prisma.companyProfile.findUnique({
      where: { organizationId: user.organizationId },
    });
    return profile;
  }

  async saveCompanyProfile(data: any, user: AuthenticatedUser) {
    const upserted = await this.prisma.companyProfile.upsert({
      where: { organizationId: user.organizationId },
      update: {
        name: data.name || 'Digitechzo',
        email: data.email,
        phone: data.phone,
        address: data.address,
        taxId: data.taxId,
        website: data.website,
        logo: data.logo,
        logoHeight: data.logoHeight,
        bankAccounts: data.bankAccounts,
      },
      create: {
        organizationId: user.organizationId,
        name: data.name || 'Digitechzo',
        email: data.email,
        phone: data.phone,
        address: data.address,
        taxId: data.taxId,
        website: data.website,
        logo: data.logo,
        logoHeight: data.logoHeight,
        bankAccounts: data.bankAccounts,
      },
    });

    return upserted;
  }
}
