import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export enum InvoiceStatusEnum {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export class CreateInvoiceItemDto {
  @ApiProperty({ description: 'Line item description', example: 'Web Platform Architecture' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Additional sub-description or deliverables' })
  @IsOptional()
  @IsString()
  subdesc?: string;

  @ApiPropertyOptional({ description: 'Quantity units', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number = 1;

  @ApiProperty({ description: 'Unit or item price', example: 45000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Advance amount allocated to this item', example: 20000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  advanceAmount?: number;

  @ApiPropertyOptional({ description: 'Arbitrary custom column values (key-value pair)' })
  @IsOptional()
  customValues?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Display order index' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  order?: number;
}

export class CreateInvoiceDto {
  @ApiPropertyOptional({ description: 'Invoice number / identifier', example: 'DIGI-2026-001' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({ description: 'Client PO Number', example: 'PO-98402' })
  @IsOptional()
  @IsString()
  poNumber?: string;

  @ApiProperty({ description: 'Client or Company name', example: 'Vortex Global Tech Solutions' })
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @ApiPropertyOptional({ description: 'Client contact person name', example: 'Rajesh Kumar' })
  @IsOptional()
  @IsString()
  clientContact?: string;

  @ApiPropertyOptional({ description: 'Client email', example: 'rajesh@vortextech.com' })
  @IsOptional()
  @IsString()
  clientEmail?: string;

  @ApiPropertyOptional({ description: 'Client phone number', example: '+91 91234 56789' })
  @IsOptional()
  @IsString()
  clientPhone?: string;

  @ApiPropertyOptional({ description: 'Client address' })
  @IsOptional()
  @IsString()
  clientAddress?: string;

  @ApiPropertyOptional({ description: 'Client GSTIN / Tax ID' })
  @IsOptional()
  @IsString()
  clientTaxId?: string;

  @ApiPropertyOptional({ description: 'Linked CRM Lead UUID' })
  @IsOptional()
  @IsUUID('4')
  leadId?: string;

  @ApiPropertyOptional({ description: 'Linked CRM Customer UUID' })
  @IsOptional()
  @IsUUID('4')
  customerId?: string;

  @ApiPropertyOptional({ description: 'Invoice issue date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiProperty({ description: 'Invoice due date (YYYY-MM-DD)' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Payment terms in days', example: '15' })
  @IsOptional()
  @IsString()
  paymentTermsDays?: string;

  @ApiPropertyOptional({
    description: 'Invoice lifecycle status',
    enum: InvoiceStatusEnum,
    default: InvoiceStatusEnum.DRAFT,
  })
  @IsOptional()
  @IsEnum(InvoiceStatusEnum)
  status?: InvoiceStatusEnum = InvoiceStatusEnum.DRAFT;

  @ApiPropertyOptional({ description: 'Currency symbol or ISO code', default: '₹' })
  @IsOptional()
  @IsString()
  currency?: string = '₹';

  @ApiProperty({ description: 'Subtotal amount', example: 85000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({ description: 'Tax rate percentage', example: 18, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxRate?: number = 0;

  @ApiPropertyOptional({ description: 'Tax amount in currency', example: 14535, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxAmount?: number = 0;

  @ApiPropertyOptional({ description: 'Discount percentage', example: 5, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountRate?: number = 0;

  @ApiPropertyOptional({ description: 'Discount amount in currency', example: 4250, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountAmount?: number = 0;

  @ApiProperty({ description: 'Grand total amount', example: 95285 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total: number;

  @ApiPropertyOptional({ description: 'Total advance allocated', example: 35000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  advanceAmount?: number = 0;

  @ApiPropertyOptional({ description: 'Amount already paid', example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountPaid?: number = 0;

  @ApiPropertyOptional({ description: 'Net balance due', example: 60285, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  balanceDue?: number = 0;

  @ApiPropertyOptional({ description: 'Invoice payment terms and client notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Custom footer disclaimer' })
  @IsOptional()
  @IsString()
  footerText?: string;

  @ApiPropertyOptional({ description: 'Sender business profile snapshot' })
  @IsOptional()
  senderProfile?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Bank transfer payment configuration' })
  @IsOptional()
  bankDetails?: Record<string, any>;

  @ApiPropertyOptional({ description: 'UPI QR and VPA configuration' })
  @IsOptional()
  upiDetails?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Crypto settlement configuration' })
  @IsOptional()
  cryptoDetails?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Signature details' })
  @IsOptional()
  signature?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Custom column definitions list' })
  @IsOptional()
  customColumns?: any[];

  @ApiPropertyOptional({ description: 'Column visibility config toggles' })
  @IsOptional()
  columnConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Invoice brand color styling' })
  @IsOptional()
  activeTheme?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Complete lossless studio state snapshot' })
  @IsOptional()
  rawData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Line items array', type: [CreateInvoiceItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items?: CreateInvoiceItemDto[];
}
