import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PipelineStageResponseDto {
  @ApiProperty({ description: 'Pipeline stage UUID' })
  id: string;

  @ApiProperty({ description: 'Pipeline stage name' })
  name: string;

  @ApiProperty({ description: 'Display order index' })
  order: number;

  @ApiProperty({ description: 'Stage type category (OPEN, WON, LOST)' })
  stageType: string;

  @ApiPropertyOptional({ description: 'Benchmark deal count' })
  dealCountBenchmark?: number;

  @ApiPropertyOptional({ description: 'Benchmark total value' })
  totalValueBenchmark?: number;
}

export class LostReasonResponseDto {
  @ApiProperty({ description: 'Lost reason UUID' })
  id: string;

  @ApiProperty({ description: 'Lost reason unique code' })
  code: string;

  @ApiProperty({ description: 'Display label' })
  label: string;

  @ApiProperty({ description: 'Whether the reason is active' })
  isActive: boolean;
}

export class DealResponseDto {
  @ApiProperty({ description: 'Deal unique UUID' })
  id: string;

  @ApiProperty({ description: 'Tenant organization UUID' })
  organizationId: string;

  @ApiProperty({ description: 'Assigned owner user UUID' })
  ownerId: string;

  @ApiProperty({ description: 'Assigned owner display name' })
  ownerName: string;

  @ApiPropertyOptional({ description: 'Originating Lead UUID' })
  leadId?: string | null;

  @ApiPropertyOptional({ description: 'Originating Lead full name' })
  leadName?: string | null;

  @ApiProperty({ description: 'Pipeline stage UUID' })
  stageId: string;

  @ApiProperty({ description: 'Pipeline stage name' })
  stageName: string;

  @ApiPropertyOptional({ type: () => PipelineStageResponseDto, description: 'Full pipeline stage details' })
  stage?: PipelineStageResponseDto;

  @ApiProperty({ description: 'Deal title or opportunity name' })
  title: string;

  @ApiProperty({ description: 'Commercial deal value in INR' })
  value: number;

  @ApiPropertyOptional({ description: 'Estimated close date' })
  expectedCloseDate?: string | null;

  @ApiProperty({ description: 'Win probability percentage' })
  probability: number;

  @ApiProperty({ description: 'Deal status (OPEN, WON, LOST)' })
  status: string;

  @ApiPropertyOptional({ description: 'Lost reason UUID if status is LOST' })
  lostReasonId?: string | null;

  @ApiPropertyOptional({ description: 'Lost reason label if status is LOST' })
  lostReasonLabel?: string | null;

  @ApiPropertyOptional({ description: 'Notes on why deal was lost' })
  lostReasonNotes?: string | null;

  @ApiPropertyOptional({ description: 'Closing timestamp if WON or LOST' })
  closedAt?: string | null;

  @ApiPropertyOptional({ description: 'Closing win notes if WON' })
  wonNotes?: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;
}

export class PaginatedDealsResponseDto {
  @ApiProperty({ type: [DealResponseDto], description: 'List of deals' })
  items: DealResponseDto[];

  @ApiProperty({ description: 'Total records matching query' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Page size limit' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;
}
