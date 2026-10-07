import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsIn,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DealQueryDto {
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

  @ApiPropertyOptional({ description: 'Free-text search across title and notes' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by pipeline stage UUID' })
  @IsOptional()
  @IsUUID('4')
  stageId?: string;

  @ApiPropertyOptional({ description: 'Filter by deal status', enum: ['OPEN', 'WON', 'LOST'] })
  @IsOptional()
  @IsIn(['OPEN', 'WON', 'LOST'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by assigned rep user UUID' })
  @IsOptional()
  @IsUUID('4')
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Filter by originating lead UUID' })
  @IsOptional()
  @IsUUID('4')
  leadId?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    default: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'value', 'expectedCloseDate', 'title', 'probability'],
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'value', 'expectedCloseDate', 'title', 'probability'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction', default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
