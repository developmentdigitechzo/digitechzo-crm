import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum MeetingTypeEnum {
  MEETING = 'MEETING',
  DEMO = 'DEMO',
  DISCOVERY = 'DISCOVERY',
  FOLLOW_UP = 'FOLLOW_UP',
}

export enum MeetingStatusEnum {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export class CreateMeetingDto {
  @ApiProperty({ description: 'Meeting title or subject', example: 'Product Demo & Architecture Deep Dive' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiPropertyOptional({ description: 'Meeting agenda or context', example: 'Review architecture, pricing tiers, and SLA terms' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiProperty({ enum: MeetingTypeEnum, description: 'Type of meeting', default: MeetingTypeEnum.MEETING })
  @IsEnum(MeetingTypeEnum)
  meetingType: MeetingTypeEnum;

  @ApiProperty({ description: 'Scheduled start timestamp (ISO 8601)', example: '2026-10-15T10:00:00.000Z' })
  @IsDateString({}, { message: 'startTime must be a valid ISO 8601 date string' })
  startTime: string;

  @ApiProperty({ description: 'Scheduled end timestamp (ISO 8601)', example: '2026-10-15T11:00:00.000Z' })
  @IsDateString({}, { message: 'endTime must be a valid ISO 8601 date string' })
  endTime: string;

  @ApiPropertyOptional({ description: 'Meeting room location or video conference link', example: 'https://meet.google.com/abc-defg-hij' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  location?: string;

  @ApiProperty({ description: 'Associated lead UUID for master sales record traceability' })
  @IsString()
  @IsNotEmpty({ message: 'leadId is required for every meeting' })
  @IsUUID('4', { message: 'leadId must be a valid UUIDv4' })
  leadId: string;

  @ApiPropertyOptional({ description: 'Associated deal UUID' })
  @IsOptional()
  @IsUUID('4')
  dealId?: string;

  @ApiPropertyOptional({ description: 'Assigned meeting owner / host user UUID (defaults to creator; Admin/Manager can assign)' })
  @IsOptional()
  @IsUUID('4')
  ownerId?: string;
}
