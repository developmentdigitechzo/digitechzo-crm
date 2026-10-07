import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CancelMeetingDto {
  @ApiProperty({
    description: 'Reason for cancellation',
    example: 'Client requested reschedule due to internal conflict',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  cancelReason: string;

  @ApiPropertyOptional({ description: 'Additional notes or follow-up details' })
  @IsOptional()
  @IsString()
  notes?: string;
}
