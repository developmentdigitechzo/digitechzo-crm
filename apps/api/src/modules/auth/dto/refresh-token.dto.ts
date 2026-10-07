import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'a7183e2098d578bf...48_bytes_hex',
    description: 'High-entropy cryptographic rotating refresh token',
  })
  @IsString({ message: 'Refresh token must be a string' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}

export class LogoutDto {
  @ApiProperty({
    example: 'a7183e2098d578bf...48_bytes_hex',
    description: 'Optional specific refresh token to revoke. If omitted, all active sessions are revoked.',
    required: false,
  })
  @IsString()
  refreshToken?: string;
}
