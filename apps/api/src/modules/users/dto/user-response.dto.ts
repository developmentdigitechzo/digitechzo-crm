import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserRoleSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  displayAlias?: string;
}

export class UserOrganizationSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  roleId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: UserRoleSummaryDto })
  role: UserRoleSummaryDto;

  @ApiProperty({ type: UserOrganizationSummaryDto })
  organization: UserOrganizationSummaryDto;

  @ApiPropertyOptional()
  teamName?: string;

  @ApiPropertyOptional()
  dataScope?: string;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty({
    example: {
      total: 10,
      page: 1,
      limit: 20,
      totalPages: 1,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
