import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerUserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export class CustomerLeadSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;
}

export class CustomerDealSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  value: number;
}

export class CustomerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiPropertyOptional()
  leadId?: string;

  @ApiPropertyOptional()
  dealId?: string;

  @ApiProperty()
  companyName: string;

  @ApiProperty()
  contactName: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  postalCode?: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  customerSince: Date;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: CustomerUserSummaryDto })
  owner?: CustomerUserSummaryDto;

  @ApiPropertyOptional({ type: CustomerLeadSummaryDto })
  lead?: CustomerLeadSummaryDto;

  @ApiPropertyOptional({ type: CustomerDealSummaryDto })
  deal?: CustomerDealSummaryDto;
}

export class PaginatedCustomersResponseDto {
  @ApiProperty({ type: [CustomerResponseDto] })
  data: CustomerResponseDto[];

  @ApiProperty({
    example: {
      total: 5,
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
