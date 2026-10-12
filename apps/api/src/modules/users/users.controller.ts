import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserProfileDto } from './dto/user-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserResponseDto, PaginatedUsersResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
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

  @Get()
  @Permissions('users:read')
  @ApiOperation({
    summary: 'List organization users with search, role filtering, and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'List of organization users retrieved successfully',
    type: PaginatedUsersResponseDto,
  })
  async findAll(
    @Query() query: UserQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedUsersResponseDto> {
    return this.usersService.findAll(query, user);
  }

  @Get(':id')
  @Permissions('users:read')
  @ApiOperation({
    summary: 'Get user details by ID within organization',
  })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return this.usersService.findScopedById(id, user);
  }

  @Post()
  @Permissions('users:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create / onboard a new user into the organization directory',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid role or input payload' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return this.usersService.create(dto, user);
  }

  @Patch(':id')
  @Permissions('users:update')
  @ApiOperation({
    summary: 'Update user name, role, phone, or active status',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto, user);
  }

  @Delete(':id')
  @Permissions('users:delete')
  @ApiOperation({
    summary: 'Deactivate user account within organization',
  })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
  })
  @ApiResponse({ status: 400, description: 'Self-deactivation prevented' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.usersService.remove(id, user);
  }
}
