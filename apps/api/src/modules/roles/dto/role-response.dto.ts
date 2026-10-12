import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isSystem: boolean;

  @ApiPropertyOptional()
  displayAlias?: string;

  @ApiProperty()
  createdAt: Date;
}
