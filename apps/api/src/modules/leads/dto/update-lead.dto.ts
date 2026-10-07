import {
  IsString,
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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  LeadPriorityEnum,
  LeadTemperatureEnum,
  NextActionTypeEnum,
} from './create-lead.dto';

export class UpdateLeadDto {
  @ApiPropertyOptional({ description: 'Full name of the contact', example: 'Vikram Malhotra' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fullName?: string;

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

  @ApiPropertyOptional({ description: 'Contact phone number (E.164 or digits)', example: '+919876543210' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'Phone number must be a valid E.164 format with 8 to 15 digits',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[\s\-\(\)]/g, '') : value))
  phone?: string;

  @ApiPropertyOptional({ description: 'Contact email address', example: 'vikram@apexlogistics.in' })
  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email address' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

  @ApiPropertyOptional({ enum: LeadPriorityEnum, description: 'Commercial SLA priority' })
  @IsOptional()
  @IsEnum(LeadPriorityEnum)
  priority?: LeadPriorityEnum;

  @ApiPropertyOptional({ enum: LeadTemperatureEnum, description: 'Optional commercial temperature (E1 display compatibility)' })
  @IsOptional()
  @IsEnum(LeadTemperatureEnum)
  temperature?: LeadTemperatureEnum;

  @ApiPropertyOptional({ description: 'Specific service or solution of interest', example: 'Custom CRM Development' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  serviceInterest?: string;

  @ApiPropertyOptional({ description: 'Lead score (0 to 100)', example: 80 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  leadScore?: number;

  @ApiPropertyOptional({ description: 'Snapshot next action due timestamp', example: '2026-10-12T14:00:00.000Z' })
  @IsOptional()
  @IsString()
  nextActionDueAt?: string;

  @ApiPropertyOptional({ enum: NextActionTypeEnum, description: 'Snapshot next action type' })
  @IsOptional()
  @IsEnum(NextActionTypeEnum)
  nextActionType?: NextActionTypeEnum;

  @ApiPropertyOptional({ description: 'Snapshot next action purpose/agenda' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nextActionPurpose?: string;
}
