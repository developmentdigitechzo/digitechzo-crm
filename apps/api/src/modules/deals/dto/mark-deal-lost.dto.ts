import { IsString, IsNotEmpty, IsUUID, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class MarkDealLostDto {
  @ApiProperty({ description: 'Reference lost reason UUID', example: 'd0000000-0000-0000-0000-000000000001' })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'lostReasonId must be a valid UUIDv4' })
  lostReasonId: string;

  @ApiPropertyOptional({ description: 'Detailed debrief notes on why the deal was lost', example: 'Competitor offered 30% discount' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lostReasonNotes?: string;
}
