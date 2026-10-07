import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { UpsertLeadQualificationDto } from './dto/upsert-qualification.dto';
import { UpdateNextActionDto } from './dto/update-next-action.dto';
import { UpdatePriorityTemperatureDto } from './dto/update-priority-temperature.dto';
import { LeadQueryDto } from './dto/lead-query.dto';
import {
  LeadResponseDto,
  PaginatedLeadsResponseDto,
  LeadQualificationResponseDto,
} from './dto/lead-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Leads')
@ApiBearerAuth('JWT-auth')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @Permissions('leads:read')
  @ApiOperation({
    summary: 'List leads with pagination, filters, and search',
    description:
      'Returns a paginated list of leads. Enforces scoped visibility (BDE sees only assigned leads; Admin/Manager sees organization-wide).',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated lead records retrieved successfully',
    type: PaginatedLeadsResponseDto,
  })
  async findAll(
    @Query() query: LeadQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedLeadsResponseDto> {
    return this.leadsService.findAll(query, user);
  }

  @Post()
  @Permissions('leads:create')
  @ApiOperation({
    summary: 'Create a new lead',
    description:
      'Creates a new lead within the authenticated user organization. Enforces phone and email deduplication (HTTP 409 on conflict).',
  })
  @ApiResponse({
    status: 201,
    description: 'Lead created successfully',
    type: LeadResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Active lead with phone or email already exists in this organization',
  })
  async create(
    @Body() dto: CreateLeadDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LeadResponseDto> {
    return this.leadsService.create(dto, user);
  }

  @Get(':id')
  @Permissions('leads:read')
  @ApiOperation({
    summary: 'Get 360° lead record by ID',
    description:
      'Retrieves complete lead details, owner information, next action snapshot, and BANT qualification data.',
  })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({
    status: 200,
    description: 'Lead retrieved successfully',
    type: LeadResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lead not found or inaccessible' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LeadResponseDto> {
    return this.leadsService.findOne(id, user);
  }

  @Patch(':id')
  @Permissions('leads:update')
  @ApiOperation({
    summary: 'Update lead details',
    description: 'Updates contact details, priority, service interest, lead score, or next action.',
  })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({
    status: 200,
    description: 'Lead updated successfully',
    type: LeadResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lead not found or inaccessible' })
  @ApiResponse({ status: 409, description: 'Conflict: Phone or email already belongs to another lead' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LeadResponseDto> {
    return this.leadsService.update(id, dto, user);
  }

  @Patch(':id/assign')
  @Permissions('leads:update')
  @ApiOperation({
    summary: 'Reassign lead to a team member',
    description: 'Reassigns lead ownership to an active user within the organization. Restricted to Admin and Manager roles.',
  })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({
    status: 200,
    description: 'Lead reassigned successfully',
    type: LeadResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden: Only Admin or Manager can reassign leads' })
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignLeadDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LeadResponseDto> {
    return this.leadsService.assign(id, dto, user);
  }

  @Patch(':id/status')
  @Permissions('leads:update')
  @ApiOperation({
    summary: 'Transition lead lifecycle status',
    description:
      'Transitions lead status. Requires unqualifiedReason if status is transitioned to UNQUALIFIED.',
  })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({
    status: 200,
    description: 'Lead status transitioned successfully',
    type: LeadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request: Missing unqualifiedReason for UNQUALIFIED status' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LeadResponseDto> {
    return this.leadsService.updateStatus(id, dto, user);
  }

  @Get(':id/qualification')
  @Permissions('leads:read')
  @ApiOperation({
    summary: 'Get BANT qualification for lead',
    description: 'Fetches structured budget, authority, timeline, and discovery notes for the lead.',
  })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({
    status: 200,
    description: 'Lead qualification retrieved successfully',
    type: LeadQualificationResponseDto,
  })
  async getQualification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LeadQualificationResponseDto | null> {
    return this.leadsService.getQualification(id, user);
  }

  @Put(':id/qualification')
  @Permissions('leads:update')
  @ApiOperation({
    summary: 'Upsert BANT qualification criteria (PUT)',
    description: 'Saves or updates BANT qualification criteria for the lead.',
  })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({
    status: 200,
    description: 'Qualification updated successfully',
    type: LeadQualificationResponseDto,
  })
  async upsertQualification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertLeadQualificationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LeadQualificationResponseDto> {
    return this.leadsService.upsertQualification(id, dto, user);
  }

  @Patch(':id/qualification')
  @Permissions('leads:update')
  @ApiOperation({
    summary: 'Update/Upsert BANT qualification criteria (PATCH)',
    description: 'Updates or records BANT qualification criteria for the lead.',
  })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({
    status: 200,
    description: 'Qualification updated successfully',
    type: LeadQualificationResponseDto,
  })
  async patchQualification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertLeadQualificationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LeadQualificationResponseDto> {
    return this.leadsService.upsertQualification(id, dto, user);
  }

  @Patch(':id/next-action')
  @Permissions('leads:update')
  @ApiOperation({
    summary: 'Update lead next-action snapshot',
    description: 'Updates the lightweight next-action snapshot (due date, channel type, purpose, and assigned owner).',
  })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({
    status: 200,
    description: 'Next action snapshot updated successfully',
    type: LeadResponseDto,
  })
  async updateNextAction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNextActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LeadResponseDto> {
    return this.leadsService.updateNextAction(id, dto, user);
  }

  @Patch(':id/priority')
  @Permissions('leads:update')
  @ApiOperation({
    summary: 'Update lead priority and temperature',
    description: 'Updates commercial SLA priority (LOW, MEDIUM, HIGH, URGENT) and temperature (HOT, WARM, COLD).',
  })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({
    status: 200,
    description: 'Priority and temperature updated successfully',
    type: LeadResponseDto,
  })
  async updatePriorityTemperature(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePriorityTemperatureDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LeadResponseDto> {
    return this.leadsService.updatePriorityTemperature(id, dto, user);
  }

  @Delete(':id')
  @Permissions('leads:delete')
  @ApiOperation({
    summary: 'Soft-delete a lead',
    description: 'Marks lead as soft-deleted. Restricted to Admin role with leads:delete permission.',
  })
  @ApiParam({ name: 'id', description: 'Lead UUID' })
  @ApiResponse({
    status: 200,
    description: 'Lead soft-deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.leadsService.softDelete(id, user);
  }
}
