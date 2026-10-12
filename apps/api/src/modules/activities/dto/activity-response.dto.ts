import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActivityUserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export class ActivityLeadSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  companyName?: string;
}

export class ActivityDealSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;
}

export class ActivityTaskSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;
}

export class ActivityResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  leadId?: string;

  @ApiPropertyOptional()
  dealId?: string;

  @ApiPropertyOptional()
  taskId?: string;

  @ApiProperty()
  activityType: string;

  @ApiPropertyOptional()
  direction?: string;

  @ApiProperty()
  subject: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  activityDate: Date;

  @ApiPropertyOptional()
  durationSeconds?: number;

  @ApiPropertyOptional()
  outcome?: string;

  @ApiPropertyOptional({ type: Object })
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: ActivityUserSummaryDto })
  user?: ActivityUserSummaryDto;

  @ApiPropertyOptional({ type: ActivityLeadSummaryDto })
  lead?: ActivityLeadSummaryDto;

  @ApiPropertyOptional({ type: ActivityDealSummaryDto })
  deal?: ActivityDealSummaryDto;

  @ApiPropertyOptional({ type: ActivityTaskSummaryDto })
  task?: ActivityTaskSummaryDto;
}

export class PaginatedActivitiesResponseDto {
  @ApiProperty({ type: [ActivityResponseDto] })
  data: ActivityResponseDto[];

  @ApiProperty({
    example: {
      total: 50,
      page: 1,
      limit: 20,
      totalPages: 3,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
