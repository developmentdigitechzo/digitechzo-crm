import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatusEnum } from './create-invoice.dto';

export class UpdateInvoiceStatusDto {
  @ApiProperty({
    description: 'Updated invoice lifecycle status',
    enum: InvoiceStatusEnum,
    example: InvoiceStatusEnum.PAID,
  })
  @IsNotEmpty()
  @IsEnum(InvoiceStatusEnum)
  status: InvoiceStatusEnum;
}
