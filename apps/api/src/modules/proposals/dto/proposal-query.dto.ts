import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsUUID,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProposalStatusEnum } from './create-proposal.dto';

export class ProposalQueryDto {
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

  @ApiPropertyOptional({ description: 'Search matching proposalNumber, title, or description' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ enum: ProposalStatusEnum })
  @IsOptional()
  @IsEnum(ProposalStatusEnum)
  status?: ProposalStatusEnum;

  @ApiPropertyOptional({ description: 'Filter by owner UUID' })
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

  @ApiPropertyOptional({ description: 'Minimum total amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum total amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Valid until on or after ISO date' })
  @IsOptional()
  @IsDateString()
  validUntilFrom?: string;

  @ApiPropertyOptional({ description: 'Valid until on or before ISO date' })
  @IsOptional()
  @IsDateString()
  validUntilTo?: string;

  @ApiPropertyOptional({ enum: ['createdAt', 'totalAmount', 'validUntil', 'status'], default: 'createdAt' })
  @IsOptional()
  @IsEnum(['createdAt', 'totalAmount', 'validUntil', 'status'])
  sortBy?: 'createdAt' | 'totalAmount' | 'validUntil' | 'status' = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
