import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  LeadPriorityEnum,
  LeadSourceEnum,
  LeadTemperatureEnum,
} from './create-lead.dto';
import { LeadStatusEnum } from './update-lead-status.dto';

export class LeadQueryDto {
  @ApiPropertyOptional({ description: 'Page number (1-indexed)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page (max 100)', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Free-text search across name, company, phone, email, service' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: LeadStatusEnum, description: 'Filter by lifecycle status' })
  @IsOptional()
  @IsEnum(LeadStatusEnum)
  status?: LeadStatusEnum;

  @ApiPropertyOptional({ enum: LeadPriorityEnum, description: 'Filter by priority' })
  @IsOptional()
  @IsEnum(LeadPriorityEnum)
  priority?: LeadPriorityEnum;

  @ApiPropertyOptional({ enum: LeadSourceEnum, description: 'Filter by source channel' })
  @IsOptional()
  @IsEnum(LeadSourceEnum)
  source?: LeadSourceEnum;

  @ApiPropertyOptional({ enum: LeadTemperatureEnum, description: 'Filter by commercial temperature' })
  @IsOptional()
  @IsEnum(LeadTemperatureEnum)
  temperature?: LeadTemperatureEnum;

  @ApiPropertyOptional({ description: 'Filter by assigned rep user UUID (Admin/Manager only)' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    default: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'lastActivityAt', 'fullName', 'leadScore', 'nextActionDueAt'],
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'lastActivityAt', 'fullName', 'leadScore', 'nextActionDueAt'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction', default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
