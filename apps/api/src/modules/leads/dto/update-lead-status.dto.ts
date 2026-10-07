import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum LeadStatusEnum {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  UNQUALIFIED = 'UNQUALIFIED',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
}

export enum UnqualifiedReasonEnum {
  PRICE_TOO_HIGH = 'PRICE_TOO_HIGH',
  OUT_OF_SCOPE = 'OUT_OF_SCOPE',
  STUDENT_SPAM = 'STUDENT_SPAM',
  COMPETITOR = 'COMPETITOR',
  UNRESPONSIVE = 'UNRESPONSIVE',
  OTHER = 'OTHER',
}

export class UpdateLeadStatusDto {
  @ApiProperty({
    enum: LeadStatusEnum,
    description: 'New lifecycle status',
    example: LeadStatusEnum.CONTACTED,
  })
  @IsEnum(LeadStatusEnum, {
    message: 'Status must be one of: NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED, LOST',
  })
  @IsNotEmpty()
  status: LeadStatusEnum;

  @ApiPropertyOptional({
    enum: UnqualifiedReasonEnum,
    description: 'Reason code for unqualifying the lead (required if status is UNQUALIFIED)',
    example: UnqualifiedReasonEnum.PRICE_TOO_HIGH,
  })
  @ValidateIf((o) => o.status === LeadStatusEnum.UNQUALIFIED)
  @IsNotEmpty({ message: 'unqualifiedReason is required when status is UNQUALIFIED' })
  @IsEnum(UnqualifiedReasonEnum, {
    message: 'unqualifiedReason must be one of: PRICE_TOO_HIGH, OUT_OF_SCOPE, STUDENT_SPAM, COMPETITOR, UNRESPONSIVE, OTHER',
  })
  unqualifiedReason?: UnqualifiedReasonEnum;

  @ApiPropertyOptional({
    description: 'Contextual notes explaining the unqualification decision',
    example: 'Budget is $500, minimum requirement is $5000',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  unqualifiedNotes?: string;
}
