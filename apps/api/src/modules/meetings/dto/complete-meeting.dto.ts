import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CompleteMeetingDto {
  @ApiPropertyOptional({
    description: 'Outcome of the meeting (e.g. QUALIFIED, DEMO_SUCCESSFUL, NEXT_STEPS_AGREED, RESCHEDULE_REQUESTED)',
    example: 'DEMO_SUCCESSFUL',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  outcome?: string;

  @ApiPropertyOptional({
    description: 'Detailed minutes or notes from the meeting',
    example: 'Reviewed proposal scope with CTO and Procurement Head. Client requested slight discount.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Whether to automatically record an activity entry in the activity timeline',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  createActivity?: boolean;
}
