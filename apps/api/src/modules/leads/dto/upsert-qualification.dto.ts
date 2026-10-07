import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum BudgetStatusEnum {
  CONFIRMED = 'CONFIRMED',
  ESTIMATED = 'ESTIMATED',
  EXPLORING = 'EXPLORING',
  NO_BUDGET = 'NO_BUDGET',
}

export enum AuthorityLevelEnum {
  DECISION_MAKER = 'DECISION_MAKER',
  INFLUENCER = 'INFLUENCER',
  EVALUATOR = 'EVALUATOR',
  GATEKEEPER = 'GATEKEEPER',
}

export enum TimelineHorizonEnum {
  IMMEDIATE_2WEEKS = 'IMMEDIATE_2WEEKS',
  ONE_MONTH = 'ONE_MONTH',
  THREE_MONTHS = 'THREE_MONTHS',
  EXPLORING = 'EXPLORING',
}

export class UpsertLeadQualificationDto {
  @ApiPropertyOptional({ description: 'Estimated budget amount in INR', example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetAmount?: number;

  @ApiPropertyOptional({ enum: BudgetStatusEnum, description: 'Budget clarity status' })
  @IsOptional()
  @IsEnum(BudgetStatusEnum)
  budgetStatus?: BudgetStatusEnum;

  @ApiPropertyOptional({ enum: AuthorityLevelEnum, description: 'Decision authority of primary contact' })
  @IsOptional()
  @IsEnum(AuthorityLevelEnum)
  authorityLevel?: AuthorityLevelEnum;

  @ApiPropertyOptional({ enum: TimelineHorizonEnum, description: 'Target decision/implementation timeline' })
  @IsOptional()
  @IsEnum(TimelineHorizonEnum)
  timelineHorizon?: TimelineHorizonEnum;

  @ApiPropertyOptional({ description: 'Commercial urgency rating (1 to 5)', example: 4, default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  urgencyRating?: number;

  @ApiPropertyOptional({ description: 'Customer pain point and core problem statement' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  problemStatement?: string;

  @ApiPropertyOptional({ description: 'Additional sales discovery notes' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  notes?: string;
}
