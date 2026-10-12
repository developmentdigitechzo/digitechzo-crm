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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { UpdateDealStageDto } from './dto/update-deal-stage.dto';
import { MarkDealWonDto } from './dto/mark-deal-won.dto';
import { MarkDealLostDto } from './dto/mark-deal-lost.dto';
import { AssignDealDto } from './dto/assign-deal.dto';
import { DealQueryDto } from './dto/deal-query.dto';
import {
  DealResponseDto,
  PaginatedDealsResponseDto,
  PipelineStageResponseDto,
  LostReasonResponseDto,
} from './dto/deal-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Deals')
@ApiBearerAuth('JWT-auth')
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @Permissions('deals:read')
  @ApiOperation({
    summary: 'List deals with pagination, stage/status filters, and search',
    description: 'Returns paginated deals. Scoped to assigned deals for BDE_SALES; org-wide for Admin/Manager.',
  })
  @ApiResponse({ status: 200, type: PaginatedDealsResponseDto })
  async findAll(
    @Query() query: DealQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedDealsResponseDto> {
    return this.dealsService.findAll(query, user);
  }

  @Post()
  @Permissions('deals:create')
  @ApiOperation({
    summary: 'Create a new pipeline deal',
    description: 'Creates a deal in the user organization, associating it with a stage and optional originating lead.',
  })
  @ApiResponse({ status: 201, type: DealResponseDto })
  async create(
    @Body() dto: CreateDealDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DealResponseDto> {
    return this.dealsService.create(dto, user);
  }

  @Get('stages')
  @Permissions('deals:read')
  @ApiOperation({
    summary: 'List active pipeline stages sorted by order',
    description: 'Returns all system pipeline stages with benchmark metrics in sequential display order.',
  })
  @ApiResponse({ status: 200, type: [PipelineStageResponseDto] })
  async getStages(): Promise<PipelineStageResponseDto[]> {
    return this.dealsService.getStages();
  }

  @Get('lost-reasons')
  @Permissions('deals:read')
  @ApiOperation({
    summary: 'List active deal lost reasons',
    description: 'Returns all active lost reason codes and labels for deal post-mortems and closing.',
  })
  @ApiResponse({ status: 200, type: [LostReasonResponseDto] })
  async getLostReasons(): Promise<LostReasonResponseDto[]> {
    return this.dealsService.getLostReasons();
  }

  @Get(':id')
  @Permissions('deals:read')
  @ApiOperation({
    summary: 'Get deal details by ID',
    description: 'Retrieves 360° deal opportunity details including owner, stage, and linked lead.',
  })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, type: DealResponseDto })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DealResponseDto> {
    return this.dealsService.findOne(id, user);
  }

  @Patch(':id')
  @Permissions('deals:update')
  @ApiOperation({
    summary: 'Update deal opportunity details',
    description: 'Updates deal title, commercial value, expected close date, or win probability.',
  })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, type: DealResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDealDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DealResponseDto> {
    return this.dealsService.update(id, dto, user);
  }

  @Patch(':id/stage')
  @Permissions('deals:update')
  @ApiOperation({
    summary: 'Move deal to a different pipeline stage',
    description: 'Moves deal through the sales pipeline. Automatically syncs WON/LOST status if stage warrants.',
  })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, type: DealResponseDto })
  async updateStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDealStageDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DealResponseDto> {
    return this.dealsService.updateStage(id, dto, user);
  }

  @Patch(':id/won')
  @Permissions('deals:update')
  @ApiOperation({
    summary: 'Mark deal as Closed-Won',
    description: 'Transitions deal status to WON, records win notes and close timestamp, and advances linked lead.',
  })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, type: DealResponseDto })
  async markWon(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkDealWonDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DealResponseDto> {
    return this.dealsService.markWon(id, dto, user);
  }

  @Patch(':id/lost')
  @Permissions('deals:update')
  @ApiOperation({
    summary: 'Mark deal as Closed-Lost',
    description: 'Transitions deal status to LOST, records required lost reason and debrief notes.',
  })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, type: DealResponseDto })
  async markLost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkDealLostDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DealResponseDto> {
    return this.dealsService.markLost(id, dto, user);
  }

  @Patch(':id/assign')
  @Permissions('deals:update')
  @ApiOperation({
    summary: 'Reassign deal owner',
    description: 'Reassigns deal ownership to another team member. Restricted to Admin and Manager roles.',
  })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, type: DealResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden: Only Admin or Manager can reassign deals' })
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignDealDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DealResponseDto> {
    return this.dealsService.assign(id, dto, user);
  }

  @Delete(':id')
  @Permissions('deals:delete')
  @ApiOperation({
    summary: 'Soft-delete deal',
    description: 'Marks deal as soft-deleted. Restricted to Admin role.',
  })
  @ApiParam({ name: 'id', description: 'Deal UUID' })
  @ApiResponse({ status: 200, description: 'Deal soft-deleted successfully' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.dealsService.softDelete(id, user);
  }
}
