import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { RoleResponseDto } from './dto/role-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('roles:read')
  @ApiOperation({ summary: 'List available system roles for user assignment' })
  @ApiResponse({ status: 200, type: [RoleResponseDto] })
  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.rolesService.findAll();
    return roles.map((r) => {
      let displayAlias = r.name;
      if (r.name === 'MANAGER') displayAlias = 'SALES_MANAGER';
      if (r.name === 'BDE_SALES') displayAlias = 'BDE';

      return {
        id: r.id,
        name: r.name,
        description: r.description || undefined,
        isSystem: r.isSystem,
        displayAlias,
        createdAt: r.createdAt,
      };
    });
  }
}
