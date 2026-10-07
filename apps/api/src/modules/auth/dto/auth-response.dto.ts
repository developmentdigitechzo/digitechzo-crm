import { ApiProperty } from '@nestjs/swagger';

export class AuthUserOrganizationDto {
  @ApiProperty({ example: 'b819f072-4bbf-4ad6-8e5c-7d9a8c1f0101' })
  id: string;

  @ApiProperty({ example: 'DigiTechzo Media & Technologies Pvt Ltd' })
  name: string;

  @ApiProperty({ example: 'digitechzo' })
  slug: string;
}

export class AuthUserDto {
  @ApiProperty({ example: 'a123f072-4bbf-4ad6-8e5c-7d9a8c1f0303' })
  id: string;

  @ApiProperty({ example: 'DigiTechzo Administrator' })
  name: string;

  @ApiProperty({ example: 'admin@digitechzo.com' })
  email: string;

  @ApiProperty({ example: 'ADMIN' })
  role: string;

  @ApiProperty({ example: ['users:read', 'users:create', 'leads:read'] })
  permissions: string[];

  @ApiProperty({ type: () => AuthUserOrganizationDto })
  organization: AuthUserOrganizationDto;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: '15-minute standard JWT Bearer access token',
  })
  accessToken: string;

  @ApiProperty({
    example: '9a721b0e3...',
    description: 'Cryptographic rotating refresh token (valid for 7 days)',
  })
  refreshToken: string;

  @ApiProperty({ example: 900, description: 'Access token expiration in seconds (15 min)' })
  expiresIn: number;

  @ApiProperty({ type: () => AuthUserDto })
  user: AuthUserDto;
}

export class RefreshResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'New 15-minute standard JWT Bearer access token',
  })
  accessToken: string;

  @ApiProperty({
    example: '9a721b0e3...',
    description: 'New rotated cryptographic refresh token',
  })
  refreshToken: string;

  @ApiProperty({ example: 900 })
  expiresIn: number;
}
