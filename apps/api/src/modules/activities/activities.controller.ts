import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { ActivityResponseDto, PaginatedActivitiesResponseDto } from './dto/activity-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Activities')
@ApiBearerAuth('JWT-auth')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @Permissions('activities:read')
  @ApiOperation({ summary: 'List CRM activities / timeline history with filtering and scoping' })
  @ApiResponse({ status: 200, type: PaginatedActivitiesResponseDto })
  async findAll(
    @Query() query: ActivityQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedActivitiesResponseDto> {
    return this.activitiesService.findAll(query, user);
  }

  @Get(':id')
  @Permissions('activities:read')
  @ApiOperation({ summary: 'Get activity record by ID' })
  @ApiResponse({ status: 200, type: ActivityResponseDto })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ActivityResponseDto> {
    return this.activitiesService.findById(id, user);
  }

  @Post()
  @Permissions('activities:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Log a new CRM interaction or communication record' })
  @ApiResponse({ status: 201, type: ActivityResponseDto })
  async create(
    @Body() dto: CreateActivityDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ActivityResponseDto> {
    return this.activitiesService.create(dto, user);
  }
}
