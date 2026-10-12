import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaskUserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export class TaskLeadSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  companyName?: string;
}

export class TaskDealSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  value: number;
}

export class TaskResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  assigneeId: string;

  @ApiPropertyOptional()
  creatorId?: string;

  @ApiPropertyOptional()
  leadId?: string;

  @ApiPropertyOptional()
  dealId?: string;

  @ApiProperty()
  taskType: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty()
  priority: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  completionNotes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: TaskUserSummaryDto })
  assignee?: TaskUserSummaryDto;

  @ApiPropertyOptional({ type: TaskUserSummaryDto })
  creator?: TaskUserSummaryDto;

  @ApiPropertyOptional({ type: TaskLeadSummaryDto })
  lead?: TaskLeadSummaryDto;

  @ApiPropertyOptional({ type: TaskDealSummaryDto })
  deal?: TaskDealSummaryDto;
}

export class PaginatedTasksResponseDto {
  @ApiProperty({ type: [TaskResponseDto] })
  data: TaskResponseDto[];

  @ApiProperty({
    example: {
      total: 100,
      page: 1,
      limit: 20,
      totalPages: 5,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
