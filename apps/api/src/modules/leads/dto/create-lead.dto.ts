import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum LeadSourceEnum {
  META_ADS = 'META_ADS',
  GOOGLE_ADS = 'GOOGLE_ADS',
  WEBSITE_FORM = 'WEBSITE_FORM',
  WHATSAPP = 'WHATSAPP',
  MANUAL = 'MANUAL',
  IMPORT = 'IMPORT',
  PHONE_INBOUND = 'PHONE_INBOUND',
}

export enum LeadPriorityEnum {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum LeadTemperatureEnum {
  HOT = 'HOT',
  WARM = 'WARM',
  COLD = 'COLD',
}

export enum NextActionTypeEnum {
  CALL = 'CALL',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  PROPOSAL = 'PROPOSAL',
  INTERNAL_REVIEW = 'INTERNAL_REVIEW',
}

export class CreateLeadDto {
  @ApiProperty({ description: 'Full name of the contact', example: 'Vikram Malhotra' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fullName: string;

  @ApiPropertyOptional({ description: 'Organization or company name', example: 'Apex Logistics Ltd' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  companyName?: string;

  @ApiPropertyOptional({ description: 'Designation or job title', example: 'VP of Technology' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiProperty({ description: 'Contact phone number (E.164 or digits)', example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'Phone number must be a valid E.164 format with 8 to 15 digits',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[\s\-\(\)]/g, '') : value))
  phone: string;

  @ApiPropertyOptional({ description: 'Contact email address', example: 'vikram@apexlogistics.in' })
  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email address' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : undefined))
  email?: string;

  @ApiProperty({ enum: LeadSourceEnum, description: 'Marketing or capture source channel', example: LeadSourceEnum.WEBSITE_FORM })
  @IsEnum(LeadSourceEnum, {
    message: 'Source must be one of: META_ADS, GOOGLE_ADS, WEBSITE_FORM, WHATSAPP, MANUAL, IMPORT, PHONE_INBOUND',
  })
  source: LeadSourceEnum;

  @ApiPropertyOptional({ enum: LeadPriorityEnum, description: 'Commercial SLA priority', default: LeadPriorityEnum.MEDIUM })
  @IsOptional()
  @IsEnum(LeadPriorityEnum)
  priority?: LeadPriorityEnum;

  @ApiPropertyOptional({ enum: LeadTemperatureEnum, description: 'Optional commercial temperature (E1 display compatibility)' })
  @IsOptional()
  @IsEnum(LeadTemperatureEnum)
  temperature?: LeadTemperatureEnum;

  @ApiProperty({ description: 'Specific service or solution of interest', example: 'Custom CRM Development' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  serviceInterest: string;

  @ApiPropertyOptional({ description: 'Assigned owner user UUID (defaults to creator)', example: 'a0000000-0000-0000-0000-000000000002' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Lead score (0 to 100)', example: 75 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  leadScore?: number;

  @ApiPropertyOptional({ description: 'Snapshot next action due timestamp', example: '2026-10-10T10:00:00.000Z' })
  @IsOptional()
  @IsString()
  nextActionDueAt?: string;

  @ApiPropertyOptional({ enum: NextActionTypeEnum, description: 'Snapshot next action type', example: NextActionTypeEnum.CALL })
  @IsOptional()
  @IsEnum(NextActionTypeEnum)
  nextActionType?: NextActionTypeEnum;

  @ApiPropertyOptional({ description: 'Snapshot next action purpose/agenda', example: 'Discovery call on requirements' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nextActionPurpose?: string;
}
