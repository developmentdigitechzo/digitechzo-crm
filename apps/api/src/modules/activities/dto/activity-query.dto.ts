import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityTypeEnum, ActivityDirectionEnum } from './create-activity.dto';

export class ActivityQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by associated lead UUID' })
  @IsOptional()
  @IsUUID('4')
  leadId?: string;

  @ApiPropertyOptional({ description: 'Filter by associated deal UUID' })
  @IsOptional()
  @IsUUID('4')
  dealId?: string;

  @ApiPropertyOptional({ description: 'Filter by associated task UUID' })
  @IsOptional()
  @IsUUID('4')
  taskId?: string;

  @ApiPropertyOptional({ description: 'Filter by user UUID who logged the activity' })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @ApiPropertyOptional({ enum: ActivityTypeEnum, description: 'Filter by activity type' })
  @IsOptional()
  @IsEnum(ActivityTypeEnum)
  activityType?: ActivityTypeEnum;

  @ApiPropertyOptional({ enum: ActivityDirectionEnum, description: 'Filter by communication direction' })
  @IsOptional()
  @IsEnum(ActivityDirectionEnum)
  direction?: ActivityDirectionEnum;

  @ApiPropertyOptional({ description: 'Start date/time (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date/time (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Search term matching subject or description' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ enum: ['activityDate', 'createdAt'], default: 'activityDate' })
  @IsOptional()
  @IsEnum(['activityDate', 'createdAt'])
  sortBy?: 'activityDate' | 'createdAt' = 'activityDate';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
