import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserQueryDto {
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

  @ApiPropertyOptional({ description: 'Search matching name, email, or phone' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by role name or alias (ADMIN, MANAGER, BDE, etc.)' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  role?: string;

  @ApiPropertyOptional({ description: 'Filter by account status (ACTIVE or INACTIVE)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ['name', 'email', 'createdAt', 'status'], default: 'createdAt' })
  @IsOptional()
  @IsEnum(['name', 'email', 'createdAt', 'status'])
  sortBy?: 'name' | 'email' | 'createdAt' | 'status' = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
