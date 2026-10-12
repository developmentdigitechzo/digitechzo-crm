import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { CompleteMeetingDto } from './dto/complete-meeting.dto';
import { CancelMeetingDto } from './dto/cancel-meeting.dto';
import { AssignMeetingDto } from './dto/assign-meeting.dto';
import { MeetingQueryDto } from './dto/meeting-query.dto';
import { MeetingResponseDto, PaginatedMeetingsResponseDto } from './dto/meeting-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Meetings')
@ApiBearerAuth('JWT-auth')
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  @Permissions('meetings:read')
  @ApiOperation({ summary: 'List meetings and demos with filtering and ownership scoping' })
  @ApiResponse({ status: 200, type: PaginatedMeetingsResponseDto })
  async findAll(
    @Query() query: MeetingQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedMeetingsResponseDto> {
    return this.meetingsService.findAll(query, user);
  }

  @Get(':id')
  @Permissions('meetings:read')
  @ApiOperation({ summary: 'Get meeting by ID' })
  @ApiResponse({ status: 200, type: MeetingResponseDto })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MeetingResponseDto> {
    return this.meetingsService.findById(id, user);
  }

  @Post()
  @Permissions('meetings:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule a new meeting or product demo' })
  @ApiResponse({ status: 201, type: MeetingResponseDto })
  async create(
    @Body() dto: CreateMeetingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MeetingResponseDto> {
    return this.meetingsService.create(dto, user);
  }

  @Patch(':id')
  @Permissions('meetings:update')
  @ApiOperation({ summary: 'Update meeting schedule or notes' })
  @ApiResponse({ status: 200, type: MeetingResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeetingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MeetingResponseDto> {
    return this.meetingsService.update(id, dto, user);
  }

  @Post(':id/complete')
  @Permissions('meetings:update')
  @ApiOperation({ summary: 'Mark meeting as completed with outcome and minutes' })
  @ApiResponse({ status: 200, type: MeetingResponseDto })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteMeetingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MeetingResponseDto> {
    return this.meetingsService.complete(id, dto, user);
  }

  @Post(':id/cancel')
  @Permissions('meetings:update')
  @ApiOperation({ summary: 'Cancel scheduled meeting with reason' })
  @ApiResponse({ status: 200, type: MeetingResponseDto })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelMeetingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MeetingResponseDto> {
    return this.meetingsService.cancel(id, dto, user);
  }

  @Post(':id/no-show')
  @Permissions('meetings:update')
  @ApiOperation({ summary: 'Mark prospect as no-show' })
  @ApiResponse({ status: 200, type: MeetingResponseDto })
  async markNoShow(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MeetingResponseDto> {
    return this.meetingsService.markNoShow(id, user);
  }

  @Post(':id/assign')
  @Permissions('meetings:update')
  @ApiOperation({ summary: 'Reassign meeting host (Admin/Manager only)' })
  @ApiResponse({ status: 200, type: MeetingResponseDto })
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignMeetingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MeetingResponseDto> {
    return this.meetingsService.assign(id, dto, user);
  }

  @Delete(':id')
  @Permissions('meetings:delete')
  @ApiOperation({ summary: 'Soft-delete a meeting' })
  @ApiResponse({ status: 200, description: 'Meeting deleted successfully' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.meetingsService.remove(id, user);
  }
}
