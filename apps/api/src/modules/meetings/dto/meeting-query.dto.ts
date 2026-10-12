import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MeetingTypeEnum, MeetingStatusEnum } from './create-meeting.dto';

export class MeetingQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search term matching title or description' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ enum: MeetingStatusEnum })
  @IsOptional()
  @IsEnum(MeetingStatusEnum)
  status?: MeetingStatusEnum;

  @ApiPropertyOptional({ enum: MeetingTypeEnum })
  @IsOptional()
  @IsEnum(MeetingTypeEnum)
  meetingType?: MeetingTypeEnum;

  @ApiPropertyOptional({ description: 'Filter by meeting owner / host UUID' })
  @IsOptional()
  @IsUUID('4')
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Filter by lead UUID' })
  @IsOptional()
  @IsUUID('4')
  leadId?: string;

  @ApiPropertyOptional({ description: 'Filter by deal UUID' })
  @IsOptional()
  @IsUUID('4')
  dealId?: string;

  @ApiPropertyOptional({ description: 'Filter for upcoming scheduled meetings (startTime >= now)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  upcoming?: boolean;

  @ApiPropertyOptional({ description: 'Filter for past-due/overdue meetings (scheduled start in past and still status SCHEDULED)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  overdue?: boolean;

  @ApiPropertyOptional({ description: 'Filter meetings starting on or after this ISO date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter meetings starting on or before this ISO date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ['startTime', 'createdAt', 'status'], default: 'startTime' })
  @IsOptional()
  @IsEnum(['startTime', 'createdAt', 'status'])
  sortBy?: 'startTime' | 'createdAt' | 'status' = 'startTime';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}
