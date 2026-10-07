import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum ActivityTypeEnum {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  NOTE = 'NOTE',
  MEETING = 'MEETING',
  TASK = 'TASK',
  SYSTEM = 'SYSTEM',
}

export enum ActivityDirectionEnum {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export class CreateActivityDto {
  @ApiProperty({
    enum: ActivityTypeEnum,
    description: 'Type of communication or activity',
    example: ActivityTypeEnum.CALL,
  })
  @IsEnum(ActivityTypeEnum)
  @IsNotEmpty()
  activityType: ActivityTypeEnum;

  @ApiPropertyOptional({
    enum: ActivityDirectionEnum,
    description: 'Direction of communication (INBOUND or OUTBOUND)',
    example: ActivityDirectionEnum.OUTBOUND,
  })
  @IsOptional()
  @IsEnum(ActivityDirectionEnum)
  direction?: ActivityDirectionEnum;

  @ApiProperty({
    description: 'Subject or brief title of the activity',
    example: 'Introductory discovery call with CTO',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  subject: string;

  @ApiPropertyOptional({
    description: 'Detailed description or notes from the interaction',
    example: 'Discussed requirements for CRM migration. Client is evaluating 3 vendors.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    description: 'Timestamp when the activity took place (defaults to now)',
    example: '2026-10-07T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'activityDate must be a valid ISO 8601 date string' })
  activityDate?: string;

  @ApiPropertyOptional({
    description: 'Duration in seconds for calls/meetings',
    example: 600,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @ApiPropertyOptional({
    description: 'Outcome of the interaction (e.g. CONNECTED, NO_ANSWER, LEFT_VOICEMAIL, COMPLETED)',
    example: 'CONNECTED',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  outcome?: string;

  @ApiPropertyOptional({
    description: 'Associated lead UUID',
  })
  @IsOptional()
  @IsUUID('4')
  leadId?: string;

  @ApiPropertyOptional({
    description: 'Associated deal UUID',
  })
  @IsOptional()
  @IsUUID('4')
  dealId?: string;

  @ApiPropertyOptional({
    description: 'Associated task UUID',
  })
  @IsOptional()
  @IsUUID('4')
  taskId?: string;

  @ApiPropertyOptional({
    description: 'Structured metadata (e.g. headers, caller ID, recording link, custom tags)',
    example: { channel: 'direct_phone', tags: ['decision-maker', 'demo-requested'] },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
