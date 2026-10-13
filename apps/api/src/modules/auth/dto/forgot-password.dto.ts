import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'admin@digitechzo.com',
    description: 'Registered user email address',
  })
  @IsEmail({}, { message: 'Must provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'admin@digitechzo.com',
    description: 'Registered user email address',
  })
  @IsEmail({}, { message: 'Must provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit email verification code',
  })
  @IsString()
  @Length(6, 6, { message: 'Verification code must be 6 digits' })
  code: string;

  @ApiProperty({
    example: 'AdminSecurePassword123!',
    description: 'New strong account password',
  })
  @IsString()
  @MinLength(8, { message: 'Password must contain at least 8 characters' })
  newPassword: string;
}
