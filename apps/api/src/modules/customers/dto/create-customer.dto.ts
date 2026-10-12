import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsEmail,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum CustomerStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  AT_RISK = 'AT_RISK',
  CHURNED = 'CHURNED',
}

export class CreateCustomerDto {
  @ApiProperty({ description: 'Customer company or organization name', example: 'Acme Technologies Pvt Ltd' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  companyName: string;

  @ApiProperty({ description: 'Primary contact person full name', example: 'Rohan Sharma' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  contactName: string;

  @ApiPropertyOptional({ description: 'Designation / job title', example: 'Chief Technology Officer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiProperty({ description: 'Primary telephone number', example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone: string;

  @ApiProperty({ description: 'Primary business email address', example: 'rohan@acme.com' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

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

  @ApiPropertyOptional({ description: 'Country', default: 'India' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string = 'India';

  @ApiPropertyOptional({ enum: CustomerStatusEnum, default: CustomerStatusEnum.ACTIVE })
  @IsOptional()
  @IsEnum(CustomerStatusEnum)
  status?: CustomerStatusEnum = CustomerStatusEnum.ACTIVE;

  @ApiProperty({ description: 'Originating Lead UUID for master sales record traceability' })
  @IsString()
  @IsNotEmpty({ message: 'leadId is required for every customer' })
  @IsUUID('4', { message: 'leadId must be a valid UUIDv4' })
  leadId: string;

  @ApiPropertyOptional({ description: 'Converted deal UUID for revenue reference' })
  @IsOptional()
  @IsUUID('4')
  dealId?: string;

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
