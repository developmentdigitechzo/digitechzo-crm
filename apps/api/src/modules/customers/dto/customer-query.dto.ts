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
import { CustomerStatusEnum } from './create-customer.dto';

export class CustomerQueryDto {
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

  @ApiPropertyOptional({ description: 'Search term for company name, contact name, email, or phone' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ enum: CustomerStatusEnum })
  @IsOptional()
  @IsEnum(CustomerStatusEnum)
  status?: CustomerStatusEnum;

  @ApiPropertyOptional({ description: 'Filter by account owner UUID' })
  @IsOptional()
  @IsUUID('4')
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Filter by exact company name' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ description: 'Customer onboard date on or after (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  customerSinceFrom?: string;

  @ApiPropertyOptional({ description: 'Customer onboard date on or before (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  customerSinceTo?: string;

  @ApiPropertyOptional({ enum: ['customerSince', 'companyName', 'createdAt', 'status'], default: 'customerSince' })
  @IsOptional()
  @IsEnum(['customerSince', 'companyName', 'createdAt', 'status'])
  sortBy?: 'customerSince' | 'companyName' | 'createdAt' | 'status' = 'customerSince';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
