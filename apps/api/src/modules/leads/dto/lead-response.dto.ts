import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NextActionDto {
  @ApiPropertyOptional({ description: 'Due date timestamp', example: '2026-10-10T10:00:00.000Z' })
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Action type', example: 'CALL' })
  type?: string;

  @ApiPropertyOptional({ description: 'Purpose / agenda', example: 'Follow up on proposal review' })
  purpose?: string;

  @ApiPropertyOptional({ description: 'Assigned user UUID for the action' })
  ownerId?: string;
}

export class LeadQualificationResponseDto {
  @ApiProperty({ description: 'Qualification UUID' })
  id: string;

  @ApiProperty({ description: 'Associated lead UUID' })
  leadId: string;

  @ApiPropertyOptional({ description: 'Estimated budget in INR' })
  budgetAmount?: number | null;

  @ApiPropertyOptional({ description: 'Budget status' })
  budgetStatus?: string | null;

  @ApiPropertyOptional({ description: 'Decision maker authority level' })
  authorityLevel?: string | null;

  @ApiPropertyOptional({ description: 'Timeline horizon' })
  timelineHorizon?: string | null;

  @ApiPropertyOptional({ description: 'Urgency rating (1 to 5)' })
  urgencyRating?: number | null;

  @ApiPropertyOptional({ description: 'Identified problem statement' })
  problemStatement?: string | null;

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string | null;

  @ApiPropertyOptional({ description: 'UUID of user who qualified' })
  qualifiedByUserId?: string | null;

  @ApiProperty({ description: 'Timestamp when qualification was recorded' })
  qualifiedAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;
}

export class LeadResponseDto {
  @ApiProperty({ description: 'Lead unique UUID' })
  id: string;

  @ApiProperty({ description: 'Tenant organization UUID' })
  organizationId: string;

  @ApiProperty({ description: 'Full name of contact' })
  fullName: string;

  @ApiPropertyOptional({ description: 'Organization or company name' })
  companyName?: string | null;

  @ApiPropertyOptional({ description: 'Designation or job title' })
  title?: string | null;

  @ApiProperty({ description: 'Contact phone number' })
  phone: string;

  @ApiPropertyOptional({ description: 'Contact email address' })
  email?: string | null;

  @ApiProperty({ description: 'Lead acquisition source' })
  source: string;

  @ApiProperty({ description: 'Lifecycle status (NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED, LOST)' })
  status: string;

  @ApiProperty({ description: 'Commercial SLA priority (LOW, MEDIUM, HIGH, URGENT)' })
  priority: string;

  @ApiPropertyOptional({ description: 'Optional commercial temperature (HOT, WARM, COLD)' })
  temperature?: string | null;

  @ApiPropertyOptional({ description: 'Lead score (0-100)' })
  leadScore?: number | null;

  @ApiProperty({ description: 'Service or solution interest' })
  serviceInterest: string;

  @ApiProperty({ description: 'Assigned owner user UUID' })
  ownerId: string;

  @ApiProperty({ description: 'Assigned owner display name (E1 compatibility)' })
  ownerName: string;

  @ApiPropertyOptional({ description: 'Reason code if disqualified' })
  unqualifiedReason?: string | null;

  @ApiPropertyOptional({ description: 'Notes if disqualified' })
  unqualifiedNotes?: string | null;

  @ApiProperty({ description: 'Timestamp of last activity' })
  lastActivityAt: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;

  @ApiPropertyOptional({ type: NextActionDto, description: 'Lightweight next action snapshot' })
  nextAction?: NextActionDto | null;

  @ApiPropertyOptional({ type: LeadQualificationResponseDto, description: 'BANT qualification data' })
  qualification?: LeadQualificationResponseDto | null;
}

export class PaginatedLeadsResponseDto {
  @ApiProperty({ type: [LeadResponseDto], description: 'List of leads' })
  items: LeadResponseDto[];

  @ApiProperty({ description: 'Total number of records matching query' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}
