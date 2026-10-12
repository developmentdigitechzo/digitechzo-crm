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
      customerCreated: p.customerCreated,
      customerExisted: p.customerExisted,
      customerId: p.customerId,
      message: p.message,
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
    } else if (dto.status === ProposalStatusEnum.REJECTED) {
      updateData.rejectedAt = now;
      if (dto.rejectionReason) updateData.rejectionReason = dto.rejectionReason;
    }

    if (dto.status === ProposalStatusEnum.ACCEPTED) {
      updateData.acceptedAt = now;

      // Atomic transition: Update proposal, advance deal & lead, create/link customer
      const result = await this.prisma.$transaction(async (tx) => {
        const currentProposal = await tx.proposal.findUnique({
          where: { id },
          include: {
            lead: true,
            deal: true,
            owner: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
        });

        if (!currentProposal) {
          throw new NotFoundException(`Proposal ${id} not found`);
        }

        const updated = await tx.proposal.update({
          where: { id },
          data: updateData,
          include: {
            owner: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
            lead: { select: { id: true, fullName: true, companyName: true } },
            deal: { select: { id: true, title: true } },
          },
        });

        const targetLeadId = currentProposal.leadId;
        const targetDealId = currentProposal.dealId;
        let activeDeal: any = null;

        if (targetDealId || targetLeadId) {
          const dealWhere: any = {
            organizationId: user.organizationId,
            deletedAt: null,
          };
          if (targetDealId) {
            dealWhere.id = targetDealId;
          } else if (targetLeadId) {
            dealWhere.leadId = targetLeadId;
          }

          activeDeal = await tx.deal.findFirst({
            where: dealWhere,
            include: { stage: true },
          });

          if (activeDeal) {
            const wonStage = (await tx.pipelineStage.findFirst({
              where: { stageType: 'WON' },
            })) || (await tx.pipelineStage.findFirst({
              where: { name: { contains: 'Won', mode: 'insensitive' } },
            }));

            const dealUpdateData: any = {
              status: 'WON',
              closedAt: now,
              wonNotes: `Closed Won upon acceptance of proposal ${currentProposal.proposalNumber}`,
              value: new Prisma.Decimal(updated.totalAmount),
            };
            if (wonStage) {
              dealUpdateData.stageId = wonStage.id;
            }

            await tx.deal.update({
              where: { id: activeDeal.id },
              data: dealUpdateData,
            });

            if (!currentProposal.dealId) {
              await tx.proposal.update({
                where: { id: currentProposal.id },
                data: { dealId: activeDeal.id },
              });
            }
          }
        }

        const lead =
          currentProposal.lead ||
          (targetLeadId ? await tx.lead.findUnique({ where: { id: targetLeadId } }) : null);

        if (lead) {
          await tx.lead.update({
            where: { id: lead.id },
            data: {
              status: 'CONVERTED',
              lastActivityAt: now,
            },
          });
        }

        let customer: any = null;
        let customerCreated = false;
        let customerExisted = false;

        if (lead) {
          const orConditions: any[] = [{ leadId: lead.id }];
          if (lead.email && lead.email.trim()) {
            orConditions.push({
              email: { equals: lead.email.trim(), mode: 'insensitive' as Prisma.QueryMode },
            });
          }

          customer = await tx.customer.findFirst({
            where: {
              organizationId: user.organizationId,
              OR: orConditions,
            },
            orderBy: { createdAt: 'desc' },
          });

          const formattedAmount = `₹${Number(updated.totalAmount).toLocaleString('en-IN')}`;
          const proposalSummary = `Accepted Proposal: ${currentProposal.proposalNumber} (${currentProposal.title}) - ${formattedAmount}`;
          const serviceSummary = lead.serviceInterest
            ? `Service: ${lead.serviceInterest}`
            : activeDeal?.title
            ? `Deal: ${activeDeal.title}`
            : '';
          const combinedNote = [serviceSummary, proposalSummary].filter(Boolean).join(' | ');

          if (!customer) {
            const companyName = lead.companyName?.trim() || lead.fullName?.trim() || currentProposal.title;
            const contactName = lead.fullName?.trim() || lead.companyName?.trim() || 'Primary Contact';
            const email = lead.email?.trim() || 'client@digitechzo.com';
            const phone = lead.phone?.trim() || '—';
            const ownerId = currentProposal.ownerId || lead.ownerId || user.userId;
            const dealId = activeDeal?.id || currentProposal.dealId || null;

            customer = await tx.customer.create({
              data: {
                organizationId: user.organizationId,
                leadId: lead.id,
                dealId,
                companyName,
                contactName,
                email,
                phone,
                status: 'ACTIVE',
                ownerId,
                notes: combinedNote,
                customerSince: now,
              },
              include: {
                owner: { select: { id: true, name: true, email: true } },
                lead: { select: { id: true, fullName: true } },
                deal: { select: { id: true, title: true, value: true } },
              },
            });
            customerCreated = true;
          } else {
            customerExisted = true;
            const dealIdToLink = activeDeal?.id || currentProposal.dealId || customer.dealId;
            const existingNotes = customer.notes || '';
            const updatedNotes = existingNotes.includes(currentProposal.proposalNumber)
              ? existingNotes
              : existingNotes
              ? `${existingNotes}\n\n${combinedNote}`
              : combinedNote;

            customer = await tx.customer.update({
              where: { id: customer.id },
              data: {
                ...(dealIdToLink ? { dealId: dealIdToLink } : {}),
                notes: updatedNotes,
                status: 'ACTIVE',
                deletedAt: null,
              },
              include: {
                owner: { select: { id: true, name: true, email: true } },
                lead: { select: { id: true, fullName: true } },
                deal: { select: { id: true, title: true, value: true } },
              },
            });
          }
        }

        return {
          updated,
          activeDeal,
          customer,
          customerCreated,
          customerExisted,
        };
      });

      if (result.customerCreated && result.customer) {
        await this.auditService.record({
          organizationId: user.organizationId,
          userId: user.userId,
          action: 'CUSTOMER_CREATED',
          resource: 'customers',
          resourceId: result.customer.id,
          details: {
            companyName: result.customer.companyName,
            contactName: result.customer.contactName,
            source: 'PROPOSAL_ACCEPTED',
            proposalId: result.updated.id,
            proposalNumber: existing.proposalNumber,
          },
        });
      }

      await this.auditService.record({
        organizationId: user.organizationId,
        userId: user.userId,
        action: 'PROPOSAL_STATUS_ACCEPTED',
        resource: 'proposals',
        resourceId: result.updated.id,
        details: {
          previousStatus: existing.status,
          newStatus: 'ACCEPTED',
          customerCreated: result.customerCreated,
          customerExisted: result.customerExisted,
          customerId: result.customer?.id,
        },
      });

      const responseDto = this.mapToResponseDto(result.updated);
      responseDto.customerCreated = result.customerCreated;
      responseDto.customerExisted = result.customerExisted;
      responseDto.customerId = result.customer?.id;
      responseDto.message = result.customerCreated
        ? 'Proposal accepted successfully. Customer account created.'
        : 'Proposal accepted successfully. Linked to existing customer account.';

      return responseDto;
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

    // When proposal is DECLINED/REJECTED — remove the linked customer (if created from this lead)
    if (dto.status === ProposalStatusEnum.REJECTED) {
      try {
        const targetLeadId = existing.leadId;

        if (targetLeadId) {
          // Check if another proposal for this lead is still accepted
          const otherAcceptedProposal = await this.prisma.proposal.findFirst({
            where: {
              organizationId: user.organizationId,
              leadId: targetLeadId,
              id: { not: existing.id },
              status: ProposalStatusEnum.ACCEPTED,
              deletedAt: null,
            },
          });

          if (!otherAcceptedProposal) {
            // Find all active customers linked to this lead or deal
            const linkedCustomers = await this.prisma.customer.findMany({
              where: {
                organizationId: user.organizationId,
                deletedAt: null,
                OR: [
                  { leadId: targetLeadId },
                  ...(existing.dealId ? [{ dealId: existing.dealId }] : []),
                ],
              },
            });

            for (const linkedCustomer of linkedCustomers) {
              // Soft-delete the customer record
              await this.prisma.customer.update({
                where: { id: linkedCustomer.id },
                data: { deletedAt: now, status: 'INACTIVE' },
              });

              await this.auditService.record({
                organizationId: user.organizationId,
                userId: user.userId,
                action: 'CUSTOMER_REMOVED',
                resource: 'customers',
                resourceId: linkedCustomer.id,
                details: {
                  reason: `Proposal ${existing.proposalNumber} was declined`,
                  proposalId: existing.id,
                  leadId: targetLeadId,
                },
              });

              this.logger.log(
                `Customer ${linkedCustomer.id} soft-deleted after proposal ${existing.proposalNumber} was declined`,
              );
            }

          // Revert lead status from CONVERTED back to PROPOSAL_SENT
          const currentLead = await this.prisma.lead.findUnique({
            where: { id: targetLeadId },
            select: { status: true },
          });
          if (currentLead?.status === 'CONVERTED') {
            await this.prisma.lead.update({
              where: { id: targetLeadId },
              data: { status: 'PROPOSAL_SENT', lastActivityAt: now },
            });
          }

          // Revert deal status from WON back to OPEN
          const wonDeal = await this.prisma.deal.findFirst({
            where: {
              organizationId: user.organizationId,
              leadId: targetLeadId,
              status: 'WON',
              deletedAt: null,
            },
            include: { stage: true },
          });

          if (wonDeal) {
            const negotiationStage = await this.prisma.pipelineStage.findFirst({
              where: { order: 5 }, // Negotiation stage
            });
            await this.prisma.deal.update({
              where: { id: wonDeal.id },
              data: {
                status: 'OPEN',
                closedAt: null,
                wonNotes: null,
                ...(negotiationStage ? { stageId: negotiationStage.id } : {}),
              },
            });
          }
        }
      }
    } catch (e: any) {
        this.logger.warn(`Failed to handle customer removal on proposal DECLINED: ${e.message}`);
      }

      await this.auditService.record({
        organizationId: user.organizationId,
        userId: user.userId,
        action: 'PROPOSAL_STATUS_REJECTED',
        resource: 'proposals',
        resourceId: updated.id,
        details: {
          previousStatus: existing.status,
          newStatus: dto.status,
          rejectionReason: dto.rejectionReason,
        },
      });

      const rejectedDto = this.mapToResponseDto(updated);
      rejectedDto.message = 'Proposal declined. Customer account has been removed.';
      return rejectedDto;
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

    // If deleted proposal was ACCEPTED, check if linked customer should be removed
    if (existing.status === ProposalStatusEnum.ACCEPTED && existing.leadId) {
      try {
        const otherAccepted = await this.prisma.proposal.findFirst({
          where: {
            organizationId: user.organizationId,
            leadId: existing.leadId,
            id: { not: existing.id },
            status: ProposalStatusEnum.ACCEPTED,
            deletedAt: null,
          },
        });
        if (!otherAccepted) {
          await this.prisma.customer.updateMany({
            where: {
              organizationId: user.organizationId,
              deletedAt: null,
              OR: [
                { leadId: existing.leadId },
                ...(existing.dealId ? [{ dealId: existing.dealId }] : []),
              ],
            },
            data: { deletedAt: new Date(), status: 'INACTIVE' },
          });
        }
      } catch (e: any) {
        this.logger.warn(`Failed to clean up customer on proposal deletion: ${e.message}`);
      }
    }

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
