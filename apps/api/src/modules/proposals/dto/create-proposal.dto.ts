import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export enum ProposalStatusEnum {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  NEGOTIATION = 'NEGOTIATION',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export class CreateProposalDto {
  @ApiProperty({ description: 'Proposal title', example: 'Enterprise Cloud Architecture Proposal' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiPropertyOptional({ description: 'Detailed scope or proposal summary' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiProperty({ description: 'Associated originating Lead UUID for master sales record traceability' })
  @IsString()
  @IsNotEmpty({ message: 'leadId is required for every proposal' })
  @IsUUID('4', { message: 'leadId must be a valid UUIDv4' })
  leadId: string;

  @ApiPropertyOptional({ description: 'Associated deal UUID' })
  @IsOptional()
  @IsUUID('4')
  dealId?: string;

  @ApiProperty({ description: 'Subtotal amount before discount and taxes', example: 500000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({ description: 'Discount amount', example: 25000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountAmount?: number = 0;

  @ApiPropertyOptional({ description: 'Tax amount (e.g. 18% GST)', example: 85500, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxAmount?: number = 0;

  @ApiPropertyOptional({ description: 'Total amount (calculated if omitted)', example: 560500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({ description: 'Currency ISO code', default: 'INR', example: 'INR' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string = 'INR';

  @ApiPropertyOptional({ description: 'Valid until date (ISO 8601)', example: '2026-11-30T23:59:59.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'validUntil must be a valid ISO 8601 date string' })
  validUntil?: string;

  @ApiPropertyOptional({ description: 'Internal quotation notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Assigned proposal owner UUID' })
  @IsOptional()
  @IsUUID('4')
  ownerId?: string;
}
