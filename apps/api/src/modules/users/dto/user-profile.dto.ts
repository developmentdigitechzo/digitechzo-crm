import { ApiProperty } from '@nestjs/swagger';

export class UserOrganizationDto {
  @ApiProperty({ example: 'b819f072-4bbf-4ad6-8e5c-7d9a8c1f0101' })
  id: string;

  @ApiProperty({ example: 'DigiTechzo Media & Technologies Pvt Ltd' })
  name: string;

  @ApiProperty({ example: 'digitechzo' })
  slug: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;
}

export class UserRoleDto {
  @ApiProperty({ example: 'c921f072-4bbf-4ad6-8e5c-7d9a8c1f0202' })
  id: string;

  @ApiProperty({ example: 'ADMIN' })
  name: string;

  @ApiProperty({ example: 'Full system administration and control' })
  description?: string;
}

export class UserProfileDto {
  @ApiProperty({ example: 'a123f072-4bbf-4ad6-8e5c-7d9a8c1f0303' })
  id: string;

  @ApiProperty({ example: 'DigiTechzo Administrator' })
  name: string;

  @ApiProperty({ example: 'admin@digitechzo.com' })
  email: string;

  @ApiProperty({ example: '+91 98765 43210', nullable: true })
  phone?: string | null;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ type: () => UserOrganizationDto })
  organization: UserOrganizationDto;

  @ApiProperty({ type: () => UserRoleDto })
  role: UserRoleDto;

  @ApiProperty({ example: ['users:read', 'users:create', 'leads:read'] })
  permissions: string[];

  @ApiProperty({ example: '2026-10-07T10:00:00.000Z' })
  createdAt: string;
}
