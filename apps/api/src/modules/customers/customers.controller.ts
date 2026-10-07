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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { CustomerResponseDto, PaginatedCustomersResponseDto } from './dto/customer-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Permissions('customers:read')
  @ApiOperation({ summary: 'List customer accounts with search, filtering, and ownership scoping' })
  @ApiResponse({ status: 200, type: PaginatedCustomersResponseDto })
  async findAll(
    @Query() query: CustomerQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedCustomersResponseDto> {
    return this.customersService.findAll(query, user);
  }

  @Get(':id')
  @Permissions('customers:read')
  @ApiOperation({ summary: 'Get customer details by ID' })
  @ApiResponse({ status: 200, type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CustomerResponseDto> {
    return this.customersService.findById(id, user);
  }

  @Post()
  @Permissions('customers:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create/onboard a new customer or convert from won CRM deal' })
  @ApiResponse({ status: 201, type: CustomerResponseDto })
  async create(
    @Body() dto: CreateCustomerDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CustomerResponseDto> {
    return this.customersService.create(dto, user);
  }

  @Patch(':id')
  @Permissions('customers:update')
  @ApiOperation({ summary: 'Update customer contact, billing, or account status' })
  @ApiResponse({ status: 200, type: CustomerResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CustomerResponseDto> {
    return this.customersService.update(id, dto, user);
  }

  @Delete(':id')
  @Permissions('customers:delete')
  @ApiOperation({ summary: 'Soft-delete a customer account (Admin/Manager only)' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.customersService.remove(id, user);
  }
}
