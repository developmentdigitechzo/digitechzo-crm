import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  MinLength,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class UpdateProposalDto {
  @ApiPropertyOptional({ description: 'Proposal title' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiPropertyOptional({ description: 'Detailed scope or proposal summary' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({ description: 'Associated lead UUID' })
  @IsOptional()
  @IsUUID('4')
  leadId?: string;

  @ApiPropertyOptional({ description: 'Associated deal UUID' })
  @IsOptional()
  @IsUUID('4')
  dealId?: string;

  @ApiPropertyOptional({ description: 'Subtotal amount before discount and taxes' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal?: number;

  @ApiPropertyOptional({ description: 'Discount amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Tax amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Total amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({ description: 'Currency ISO code' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ description: 'Valid until date (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'validUntil must be a valid ISO 8601 date string' })
  validUntil?: string;

  @ApiPropertyOptional({ description: 'Internal quotation notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
