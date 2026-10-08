import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsDateString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateDealDto {
  @ApiProperty({ description: 'Deal title or opportunity name', example: 'Enterprise Custom CRM Solution' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiProperty({ description: 'Commercial deal value in INR', example: 1200000 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ description: 'Initial pipeline stage UUID', example: 'c0000000-0000-0000-0000-000000000001' })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'stageId must be a valid UUIDv4' })
  stageId: string;

  @ApiProperty({ description: 'Originating Lead UUID', example: 'b0000000-0000-0000-0000-000000000001' })
  @IsString()
  @IsNotEmpty({ message: 'leadId is required for every deal' })
  @IsUUID('4', { message: 'leadId must be a valid UUIDv4' })
  leadId: string;

  @ApiPropertyOptional({ description: 'Assigned deal owner UUID (Admin/Manager can assign)', example: 'a0000000-0000-0000-0000-000000000002' })
  @IsOptional()
  @IsString()
  @IsUUID('4', { message: 'ownerId must be a valid UUIDv4' })
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Estimated close date (ISO 8601)', example: '2026-11-30T00:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'expectedCloseDate must be a valid ISO 8601 date string' })
  expectedCloseDate?: string;

  @ApiPropertyOptional({ description: 'Estimated win probability percentage (0 to 100)', example: 60, default: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;
}
