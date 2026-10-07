import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserProfileDto } from './dto/user-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns authenticated user account details, organizational tenancy, role, and permission matrix.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user profile retrieved successfully',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing token' })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserProfileDto> {
    return this.usersService.getProfile(user.userId);
  }
}
