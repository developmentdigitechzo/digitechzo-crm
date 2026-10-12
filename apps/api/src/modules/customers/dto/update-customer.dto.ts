import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsEmail,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CustomerStatusEnum } from './create-customer.dto';

export class UpdateCustomerDto {
  @ApiPropertyOptional({ description: 'Customer company or organization name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  companyName?: string;

  @ApiPropertyOptional({ description: 'Primary contact person full name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  contactName?: string;

  @ApiPropertyOptional({ description: 'Designation / job title' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiPropertyOptional({ description: 'Primary telephone number' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;

  @ApiPropertyOptional({ description: 'Primary business email address' })
  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email address' })
  @MaxLength(150)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

  @ApiPropertyOptional({ description: 'Billing / office address' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'State / Province' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ description: 'Postal / PIN code' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ enum: CustomerStatusEnum })
  @IsOptional()
  @IsEnum(CustomerStatusEnum)
  status?: CustomerStatusEnum;

  @ApiPropertyOptional({ description: 'Account manager / owner user UUID' })
  @IsOptional()
  @IsUUID('4')
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Customer onboard date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  customerSince?: string;

  @ApiPropertyOptional({ description: 'Account notes / SLA details' })
  @IsOptional()
  @IsString()
  notes?: string;
}
