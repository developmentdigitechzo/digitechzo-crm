import {
  IsString,
  IsOptional,
  IsEmail,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Full name of the team member' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional({ description: 'First name' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName?: string;

  @ApiPropertyOptional({ description: 'Work email address' })
  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email address' })
  @MaxLength(150)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

  @ApiPropertyOptional({ description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;

  @ApiPropertyOptional({ description: 'System role UUID' })
  @IsOptional()
  @IsUUID('4')
  roleId?: string;

  @ApiPropertyOptional({ description: 'Role name or alias' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  role?: string;

  @ApiPropertyOptional({ description: 'User account status (ACTIVE or INACTIVE)' })
  @IsOptional()
  @IsString()
  status?: string;
}
