import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class MarkDealWonDto {
  @ApiPropertyOptional({ description: 'Executive notes summarizing the win', example: 'Contract signed for 12 months with expansion clause' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  wonNotes?: string;
}
