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
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { InvoiceResponseDto, PaginatedInvoicesResponseDto } from './dto/invoice-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Invoices')
@ApiBearerAuth('JWT-auth')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get('company-profile')
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'Get organization company profile and saved payment settings' })
  async getCompanyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.invoicesService.getCompanyProfile(user);
  }

  @Post('company-profile')
  @Permissions('invoices:update')
  @ApiOperation({ summary: 'Save organization company profile and saved payment settings' })
  async saveCompanyProfile(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invoicesService.saveCompanyProfile(body, user);
  }

  @Get()
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'List invoices with filtering, search, and pagination' })
  @ApiResponse({ status: 200, type: PaginatedInvoicesResponseDto })
  async findAll(
    @Query() query: InvoiceQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedInvoicesResponseDto> {
    return this.invoicesService.findAll(query, user);
  }

  @Get(':id')
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'Get invoice details by UUID' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.findById(id, user);
  }

  @Post()
  @Permissions('invoices:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new invoice with items and configuration' })
  @ApiResponse({ status: 201, type: InvoiceResponseDto })
  async create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.create(createInvoiceDto, user);
  }

  @Patch(':id')
  @Permissions('invoices:update')
  @ApiOperation({ summary: 'Update invoice and items' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.update(id, updateInvoiceDto, user);
  }

  @Patch(':id/status')
  @Permissions('invoices:update')
  @ApiOperation({ summary: 'Update invoice status (DRAFT, SENT, PAID, etc.)' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateInvoiceStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.updateStatus(id, updateStatusDto, user);
  }

  @Delete(':id')
  @Permissions('invoices:delete')
  @ApiOperation({ summary: 'Soft-delete invoice' })
  @ApiResponse({ status: 200, description: 'Invoice deleted successfully' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string }> {
    return this.invoicesService.delete(id, user);
  }
}
