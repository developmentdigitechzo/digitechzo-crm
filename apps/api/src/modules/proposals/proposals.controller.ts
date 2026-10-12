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
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';
import { ProposalQueryDto } from './dto/proposal-query.dto';
import { ProposalResponseDto, PaginatedProposalsResponseDto } from './dto/proposal-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Proposals')
@ApiBearerAuth('JWT-auth')
@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get()
  @Permissions('proposals:read')
  @ApiOperation({ summary: 'List proposals and quotations with filtering and scoping' })
  @ApiResponse({ status: 200, type: PaginatedProposalsResponseDto })
  async findAll(
    @Query() query: ProposalQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedProposalsResponseDto> {
    return this.proposalsService.findAll(query, user);
  }

  @Get(':id')
  @Permissions('proposals:read')
  @ApiOperation({ summary: 'Get proposal by ID' })
  @ApiResponse({ status: 200, type: ProposalResponseDto })
  @ApiResponse({ status: 404, description: 'Proposal not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProposalResponseDto> {
    return this.proposalsService.findById(id, user);
  }

  @Post()
  @Permissions('proposals:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new CRM quotation or proposal' })
  @ApiResponse({ status: 201, type: ProposalResponseDto })
  async create(
    @Body() dto: CreateProposalDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProposalResponseDto> {
    return this.proposalsService.create(dto, user);
  }

  @Patch(':id')
  @Permissions('proposals:update')
  @ApiOperation({ summary: 'Update proposal pricing, scope, or valid-until date' })
  @ApiResponse({ status: 200, type: ProposalResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProposalDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProposalResponseDto> {
    return this.proposalsService.update(id, dto, user);
  }

  @Patch(':id/status')
  @Permissions('proposals:update')
  @ApiOperation({ summary: 'Transition proposal lifecycle status (SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED, CANCELLED)' })
  @ApiResponse({ status: 200, type: ProposalResponseDto })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProposalStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProposalResponseDto> {
    return this.proposalsService.updateStatus(id, dto, user);
  }

  @Delete(':id')
  @Permissions('proposals:delete')
  @ApiOperation({ summary: 'Soft-delete a proposal' })
  @ApiResponse({ status: 200, description: 'Proposal deleted successfully' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.proposalsService.remove(id, user);
  }
}
