import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { MeetingTypeEnum, MeetingStatusEnum } from './create-meeting.dto';

export class UpdateMeetingDto {
  @ApiPropertyOptional({ description: 'Meeting title or subject' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiPropertyOptional({ description: 'Meeting agenda or context' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({ enum: MeetingTypeEnum })
  @IsOptional()
  @IsEnum(MeetingTypeEnum)
  meetingType?: MeetingTypeEnum;

  @ApiPropertyOptional({ description: 'Scheduled start timestamp (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'startTime must be a valid ISO 8601 date string' })
  startTime?: string;

  @ApiPropertyOptional({ description: 'Scheduled end timestamp (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'endTime must be a valid ISO 8601 date string' })
  endTime?: string;

  @ApiPropertyOptional({ description: 'Meeting room location or video link' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  location?: string;

  @ApiPropertyOptional({ enum: MeetingStatusEnum })
  @IsOptional()
  @IsEnum(MeetingStatusEnum)
  status?: MeetingStatusEnum;

  @ApiPropertyOptional({ description: 'Outcome summary' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  outcome?: string;

  @ApiPropertyOptional({ description: 'Meeting notes / minutes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Associated lead UUID' })
  @IsOptional()
  @IsUUID('4')
  leadId?: string;

  @ApiPropertyOptional({ description: 'Associated deal UUID' })
  @IsOptional()
  @IsUUID('4')
  dealId?: string;
}
