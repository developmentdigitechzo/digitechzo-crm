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
import { CreateProposalDto, ProposalStatusEnum } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';
import { ProposalQueryDto } from './dto/proposal-query.dto';
import { ProposalResponseDto, PaginatedProposalsResponseDto } from './dto/proposal-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProposalsService {
  private readonly logger = new Logger(ProposalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private mapToResponseDto(p: any): ProposalResponseDto {
    return {
      id: p.id,
      organizationId: p.organizationId,
      leadId: p.leadId,
      dealId: p.dealId,
      proposalNumber: p.proposalNumber,
      title: p.title,
      description: p.description,
      subtotal: Number(p.subtotal),
      discountAmount: Number(p.discountAmount),
      taxAmount: Number(p.taxAmount),
      totalAmount: Number(p.totalAmount),
      currency: p.currency,
      validUntil: p.validUntil,
      status: p.status,
      ownerId: p.ownerId,
      creatorId: p.creatorId,
      sentAt: p.sentAt,
      acceptedAt: p.acceptedAt,
      rejectedAt: p.rejectedAt,
      rejectionReason: p.rejectionReason,
      notes: p.notes,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      owner: p.owner
        ? { id: p.owner.id, name: p.owner.name, email: p.owner.email }
        : undefined,
      creator: p.creator
        ? { id: p.creator.id, name: p.creator.name, email: p.creator.email }
        : undefined,
      lead: p.lead
        ? { id: p.lead.id, fullName: p.lead.fullName, companyName: p.lead.companyName }
        : undefined,
      deal: p.deal
        ? { id: p.deal.id, title: p.deal.title }
        : undefined,
    };
  }

  private async generateProposalNumber(organizationId: string): Promise<string> {
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = await this.prisma.proposal.count({
      where: { organizationId },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `PROP-${yearMonth}-${seq}`;
  }

  async findAll(
    query: ProposalQueryDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedProposalsResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ProposalWhereInput = {
      organizationId: user.organizationId,
      deletedAt: null,
    };

    if (user.role === 'BDE_SALES') {
      where.OR = [
        { ownerId: user.userId },
        { creatorId: user.userId },
      ];
    } else if (query.ownerId) {
      where.ownerId = query.ownerId;
    }

    if (query.status) where.status = query.status;
    if (query.leadId) where.leadId = query.leadId;
    if (query.dealId) where.dealId = query.dealId;

    if (query.minAmount !== undefined || query.maxAmount !== undefined) {
      where.totalAmount = {
        ...(query.minAmount !== undefined ? { gte: query.minAmount } : {}),
        ...(query.maxAmount !== undefined ? { lte: query.maxAmount } : {}),
      };
    }

    if (query.validUntilFrom || query.validUntilTo) {
      where.validUntil = {
        ...(where.validUntil && typeof where.validUntil === 'object' ? where.validUntil : {}),
        ...(query.validUntilFrom ? { gte: new Date(query.validUntilFrom) } : {}),
        ...(query.validUntilTo ? { lte: new Date(query.validUntilTo) } : {}),
      };
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      const searchCondition = [
        { proposalNumber: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
        { title: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
        { description: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
      ];

      if (where.OR) {
        where.AND = [{ OR: searchCondition }];
      } else {
        where.OR = searchCondition;
      }
    }

    const orderBy: Prisma.ProposalOrderByWithRelationInput = {};
    const sortField = query.sortBy || 'createdAt';
    const sortDirection = query.sortOrder || 'desc';
    orderBy[sortField] = sortDirection;

    const [proposals, total] = await Promise.all([
      this.prisma.proposal.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, fullName: true, companyName: true } },
          deal: { select: { id: true, title: true } },
        },
      }),
      this.prisma.proposal.count({ where }),
    ]);

    return {
      data: proposals.map((p) => this.mapToResponseDto(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findById(id: string, user: AuthenticatedUser): Promise<ProposalResponseDto> {
    const proposal = await this.prisma.proposal.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, fullName: true, companyName: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal with ID ${id} not found`);
    }

    if (
      user.role === 'BDE_SALES' &&
      proposal.ownerId !== user.userId &&
      proposal.creatorId !== user.userId
    ) {
      throw new ForbiddenException('You do not have permission to view this proposal');
    }

    return this.mapToResponseDto(proposal);
  }

  async create(dto: CreateProposalDto, user: AuthenticatedUser): Promise<ProposalResponseDto> {
    // Verify mandatory originating lead
    const lead = await this.prisma.lead.findFirst({
      where: { id: dto.leadId, organizationId: user.organizationId, deletedAt: null },
    });
    if (!lead) throw new BadRequestException(`Associated lead ${dto.leadId} not found in this organization`);

    if (dto.dealId) {
      const deal = await this.prisma.deal.findFirst({
        where: { id: dto.dealId, organizationId: user.organizationId, deletedAt: null },
      });
      if (!deal) throw new BadRequestException(`Deal ${dto.dealId} not found`);
    }

    let targetOwnerId = user.userId;
    if (dto.ownerId) {
      if (user.role === 'BDE_SALES' && dto.ownerId !== user.userId) {
        throw new ForbiddenException('BDE sales representatives can only own proposals for themselves');
      }
      const ownerUser = await this.prisma.user.findFirst({
        where: { id: dto.ownerId, organizationId: user.organizationId, status: 'ACTIVE' },
      });
      if (!ownerUser) throw new BadRequestException('Target proposal owner user not found or inactive');
      targetOwnerId = dto.ownerId;
    }

    const subtotal = dto.subtotal;
    const discountAmount = dto.discountAmount || 0;
    const taxAmount = dto.taxAmount || 0;
    const totalAmount = dto.totalAmount !== undefined
      ? dto.totalAmount
      : Math.max(0, subtotal - discountAmount + taxAmount);

    const proposalNumber = await this.generateProposalNumber(user.organizationId);

    const proposal = await this.prisma.proposal.create({
      data: {
        organizationId: user.organizationId,
        ownerId: targetOwnerId,
        creatorId: user.userId,
        leadId: dto.leadId,
        dealId: dto.dealId || null,
        proposalNumber,
        title: dto.title,
        description: dto.description || null,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        currency: dto.currency || 'INR',
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        status: ProposalStatusEnum.DRAFT,
        notes: dto.notes || null,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, fullName: true, companyName: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    // Auto-advance Deal to Stage 4 (Proposal Sent), update Deal amount from Proposal, and update Lead
    try {
      const targetLeadId = dto.leadId;
      const targetDealId = dto.dealId;
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

        if (activeDeal) {
          // Link proposal to deal if it was unlinked
          if (!proposal.dealId) {
            await this.prisma.proposal.update({
              where: { id: proposal.id },
              data: { dealId: activeDeal.id },
            });
          }

          const stage4 = await this.prisma.pipelineStage.findFirst({
            where: { order: 4 },
          });

          const dealUpdateData: any = {
            value: new Prisma.Decimal(totalAmount),
          };
          if (stage4 && activeDeal.stage?.order < 4) {
            dealUpdateData.stageId = stage4.id;
          }

          await this.prisma.deal.update({
            where: { id: activeDeal.id },
            data: dealUpdateData,
          });

          if (stage4 && activeDeal.stage?.order < 4) {
            await this.auditService.record({
              organizationId: user.organizationId,
              userId: user.userId,
              action: 'DEAL_STAGE_CHANGED',
              resource: 'deals',
              resourceId: activeDeal.id,
              details: {
                previousStageId: activeDeal.stageId,
                newStageId: stage4.id,
                newValue: totalAmount,
                reason: `Auto-advanced to Proposal Sent and updated value upon creating proposal ${proposal.proposalNumber}`,
              },
            });
          }
        }
      }

      if (dto.leadId) {
        await this.prisma.lead.update({
          where: { id: dto.leadId },
          data: { lastActivityAt: new Date(), status: 'PROPOSAL_SENT' },
        });
      }
    } catch (e: any) {
      this.logger.warn(`Failed to auto-advance deal on proposal create: ${e.message}`);
    }

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'PROPOSAL_CREATED',
      resource: 'proposals',
      resourceId: proposal.id,
      details: {
        proposalNumber: proposal.proposalNumber,
        title: proposal.title,
        totalAmount: Number(proposal.totalAmount),
        dealId: proposal.dealId,
      },
    });

    return this.mapToResponseDto(proposal);
  }

  async update(id: string, dto: UpdateProposalDto, user: AuthenticatedUser): Promise<ProposalResponseDto> {
    const existing = await this.prisma.proposal.findFirst({
      where: { id, organizationId: user.organizationId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException(`Proposal ${id} not found`);

    if (
      user.role === 'BDE_SALES' &&
      existing.ownerId !== user.userId &&
      existing.creatorId !== user.userId
    ) {
      throw new ForbiddenException('You do not have permission to edit this proposal');
    }

    if (existing.status === ProposalStatusEnum.ACCEPTED) {
      throw new BadRequestException('Cannot modify an already accepted proposal');
    }

    const updateData: Prisma.ProposalUpdateInput = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.validUntil !== undefined) updateData.validUntil = new Date(dto.validUntil);
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    if (dto.leadId !== undefined) {
      updateData.lead = { connect: { id: dto.leadId } };
    }
    if (dto.dealId !== undefined) {
      updateData.deal = dto.dealId ? { connect: { id: dto.dealId } } : { disconnect: true };
    }

    const subtotal = dto.subtotal !== undefined ? dto.subtotal : Number(existing.subtotal);
    const discountAmount = dto.discountAmount !== undefined ? dto.discountAmount : Number(existing.discountAmount);
    const taxAmount = dto.taxAmount !== undefined ? dto.taxAmount : Number(existing.taxAmount);
    const totalAmount = dto.totalAmount !== undefined
      ? dto.totalAmount
      : Math.max(0, subtotal - discountAmount + taxAmount);

    updateData.subtotal = subtotal;
    updateData.discountAmount = discountAmount;
    updateData.taxAmount = taxAmount;
    updateData.totalAmount = totalAmount;

    const updated = await this.prisma.proposal.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, fullName: true, companyName: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'PROPOSAL_UPDATED',
      resource: 'proposals',
      resourceId: updated.id,
      details: { title: updated.title, totalAmount: Number(updated.totalAmount) },
    });

    return this.mapToResponseDto(updated);
  }

  async updateStatus(
    id: string,
    dto: UpdateProposalStatusDto,
    user: AuthenticatedUser,
  ): Promise<ProposalResponseDto> {
    const existing = await this.prisma.proposal.findFirst({
      where: { id, organizationId: user.organizationId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException(`Proposal ${id} not found`);

    if (
      user.role === 'BDE_SALES' &&
      existing.ownerId !== user.userId &&
      existing.creatorId !== user.userId
    ) {
      throw new ForbiddenException('You do not have permission to update this proposal');
    }

    const now = new Date();
    const updateData: Prisma.ProposalUpdateInput = {
      status: dto.status,
    };

    if (dto.notes) {
      updateData.notes = existing.notes ? `${existing.notes}\n\n${dto.notes}` : dto.notes;
    }

    if (dto.status === ProposalStatusEnum.SENT && !existing.sentAt) {
      updateData.sentAt = now;
    } else if (dto.status === ProposalStatusEnum.ACCEPTED) {
      updateData.acceptedAt = now;
    } else if (dto.status === ProposalStatusEnum.REJECTED) {
      updateData.rejectedAt = now;
      if (dto.rejectionReason) updateData.rejectionReason = dto.rejectionReason;
    }

    const updated = await this.prisma.proposal.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, fullName: true, companyName: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    // If status transitioned to SENT, auto-advance Deal to Stage 4, update deal value, and update Lead
    if (dto.status === ProposalStatusEnum.SENT) {
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

          if (activeDeal) {
            if (!existing.dealId) {
              await this.prisma.proposal.update({
                where: { id: existing.id },
                data: { dealId: activeDeal.id },
              });
            }

            const stage4 = await this.prisma.pipelineStage.findFirst({
              where: { order: 4 },
            });

            const dealUpdateData: any = {
              value: new Prisma.Decimal(updated.totalAmount),
            };
            if (stage4 && activeDeal.stage?.order < 4) {
              dealUpdateData.stageId = stage4.id;
            }

            await this.prisma.deal.update({
              where: { id: activeDeal.id },
              data: dealUpdateData,
            });

            if (stage4 && activeDeal.stage?.order < 4) {
              await this.auditService.record({
                organizationId: user.organizationId,
                userId: user.userId,
                action: 'DEAL_STAGE_CHANGED',
                resource: 'deals',
                resourceId: activeDeal.id,
                details: {
                  previousStageId: activeDeal.stageId,
                  newStageId: stage4.id,
                  newValue: Number(updated.totalAmount),
                  reason: `Auto-advanced to Proposal Sent and updated value upon proposal ${existing.proposalNumber} status updated to SENT`,
                },
              });
            }
          }
        }

        if (existing.leadId) {
          await this.prisma.lead.update({
            where: { id: existing.leadId },
            data: { lastActivityAt: new Date(), status: 'PROPOSAL_SENT' },
          });
        }
      } catch (e: any) {
        this.logger.warn(`Failed to auto-advance deal on proposal SENT: ${e.message}`);
      }
    }

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: `PROPOSAL_STATUS_${dto.status}`,
      resource: 'proposals',
      resourceId: updated.id,
      details: {
        previousStatus: existing.status,
        newStatus: dto.status,
        rejectionReason: dto.rejectionReason,
      },
    });

    return this.mapToResponseDto(updated);
  }

  async remove(id: string, user: AuthenticatedUser): Promise<{ message: string }> {
    const existing = await this.prisma.proposal.findFirst({
      where: { id, organizationId: user.organizationId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException(`Proposal ${id} not found`);

    if (
      user.role === 'BDE_SALES' &&
      existing.ownerId !== user.userId &&
      existing.creatorId !== user.userId
    ) {
      throw new ForbiddenException('You do not have permission to delete this proposal');
    }

    await this.prisma.proposal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.userId,
      action: 'PROPOSAL_DELETED',
      resource: 'proposals',
      resourceId: id,
      details: {},
    });

    return { message: 'Proposal deleted successfully' };
  }
}
