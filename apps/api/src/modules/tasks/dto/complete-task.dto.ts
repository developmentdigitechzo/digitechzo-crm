import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CompleteTaskDto {
  @ApiPropertyOptional({
    description: 'Notes on what was done or result of the task execution',
    example: 'Called client, agreed to proceed with proposal review on Friday',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  completionNotes?: string;

  @ApiPropertyOptional({
    description: 'Whether to automatically record a completed activity entry in the activity log',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  createActivity?: boolean;
}
