import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  Max,
  IsDateString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateDealDto {
  @ApiPropertyOptional({ description: 'Deal title or opportunity name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiPropertyOptional({ description: 'Commercial deal value in INR' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ description: 'Estimated close date (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'expectedCloseDate must be a valid ISO 8601 date string' })
  expectedCloseDate?: string;

  @ApiPropertyOptional({ description: 'Estimated win probability percentage (0 to 100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;
}
