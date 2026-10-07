import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@digitechzo.com',
    description: 'Registered user email address',
  })
  @IsEmail({}, { message: 'Must provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  @ApiProperty({
    example: 'AdminSecurePassword123!',
    description: 'User account password (Argon2id verified)',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must contain at least 8 characters' })
  password: string;
}
