import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvoiceItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceId: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  subdesc?: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional()
  advanceAmount?: number;

  @ApiPropertyOptional()
  customValues?: Record<string, any>;

  @ApiProperty()
  order: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class InvoiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  invoiceNumber: string;

  @ApiPropertyOptional()
  poNumber?: string;

  @ApiProperty()
  clientName: string;

  @ApiPropertyOptional()
  clientContact?: string;

  @ApiPropertyOptional()
  clientEmail?: string;

  @ApiPropertyOptional()
  clientPhone?: string;

  @ApiPropertyOptional()
  clientAddress?: string;

  @ApiPropertyOptional()
  clientTaxId?: string;

  @ApiPropertyOptional()
  leadId?: string;

  @ApiPropertyOptional()
  customerId?: string;

  @ApiPropertyOptional()
  creatorId?: string;

  @ApiProperty()
  issueDate: Date;

  @ApiProperty()
  dueDate: Date;

  @ApiPropertyOptional()
  paymentTermsDays?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  taxRate: number;

  @ApiProperty()
  taxAmount: number;

  @ApiProperty()
  discountRate: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  advanceAmount: number;

  @ApiProperty()
  amountPaid: number;

  @ApiProperty()
  balanceDue: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  footerText?: string;

  @ApiPropertyOptional()
  senderProfile?: Record<string, any>;

  @ApiPropertyOptional()
  bankDetails?: Record<string, any>;

  @ApiPropertyOptional()
  upiDetails?: Record<string, any>;

  @ApiPropertyOptional()
  cryptoDetails?: Record<string, any>;

  @ApiPropertyOptional()
  signature?: Record<string, any>;

  @ApiPropertyOptional()
  customColumns?: any[];

  @ApiPropertyOptional()
  columnConfig?: Record<string, any>;

  @ApiPropertyOptional()
  activeTheme?: Record<string, any>;

  @ApiPropertyOptional()
  rawData?: Record<string, any>;

  @ApiProperty({ type: [InvoiceItemResponseDto] })
  items: InvoiceItemResponseDto[];

  @ApiPropertyOptional()
  lead?: {
    id: string;
    fullName: string;
    companyName?: string;
  };

  @ApiPropertyOptional()
  customer?: {
    id: string;
    companyName: string;
    contactName: string;
  };

  @ApiPropertyOptional()
  creator?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedInvoicesResponseDto {
  @ApiProperty({ type: [InvoiceResponseDto] })
  items: InvoiceResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
