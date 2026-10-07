import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiPropertyOptional({ description: 'Full name of the team member', example: 'Neha Kulkarni' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional({ description: 'First name', example: 'Neha' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Kulkarni' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName?: string;

  @ApiProperty({ description: 'Work email address', example: 'neha.k@digitechzo.com' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @ApiPropertyOptional({ description: 'Contact phone number', example: '+919812345678' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;

  @ApiPropertyOptional({ description: 'System role UUID' })
  @IsOptional()
  @IsUUID('4')
  roleId?: string;

  @ApiPropertyOptional({ description: 'Role name or alias (e.g. BDE, SALES_MANAGER, ADMIN, MANAGER, BDE_SALES)', example: 'BDE' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  role?: string;

  @ApiPropertyOptional({ description: 'Initial account password (generated securely if omitted)' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password?: string;

  @ApiPropertyOptional({ description: 'User account status', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string = 'ACTIVE';
}
