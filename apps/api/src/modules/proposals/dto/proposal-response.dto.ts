import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProposalUserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export class ProposalLeadSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  companyName?: string;
}

export class ProposalDealSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;
}

export class ProposalResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiPropertyOptional()
  leadId?: string;

  @ApiPropertyOptional()
  dealId?: string;

  @ApiProperty()
  proposalNumber: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty()
  taxAmount: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional()
  validUntil?: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  ownerId: string;

  @ApiPropertyOptional()
  creatorId?: string;

  @ApiPropertyOptional()
  sentAt?: Date;

  @ApiPropertyOptional()
  acceptedAt?: Date;

  @ApiPropertyOptional()
  rejectedAt?: Date;

  @ApiPropertyOptional()
  rejectionReason?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: ProposalUserSummaryDto })
  owner?: ProposalUserSummaryDto;

  @ApiPropertyOptional({ type: ProposalUserSummaryDto })
  creator?: ProposalUserSummaryDto;

  @ApiPropertyOptional({ type: ProposalLeadSummaryDto })
  lead?: ProposalLeadSummaryDto;

  @ApiPropertyOptional({ type: ProposalDealSummaryDto })
  deal?: ProposalDealSummaryDto;

  @ApiPropertyOptional()
  customerCreated?: boolean;

  @ApiPropertyOptional()
  customerExisted?: boolean;

  @ApiPropertyOptional()
  customerId?: string;

  @ApiPropertyOptional()
  message?: string;
}

export class PaginatedProposalsResponseDto {
  @ApiProperty({ type: [ProposalResponseDto] })
  data: ProposalResponseDto[];

  @ApiProperty({
    example: {
      total: 10,
      page: 1,
      limit: 20,
      totalPages: 1,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
