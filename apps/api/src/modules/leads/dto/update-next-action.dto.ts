import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { NextActionTypeEnum } from './create-lead.dto';

export class UpdateNextActionDto {
  @ApiPropertyOptional({
    description: 'Scheduled timestamp when next action is due (ISO 8601)',
    example: '2026-10-15T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'nextActionDueAt must be a valid ISO 8601 date string' })
  nextActionDueAt?: string;

  @ApiPropertyOptional({
    enum: NextActionTypeEnum,
    description: 'Channel or modality of the scheduled action',
    example: NextActionTypeEnum.CALL,
  })
  @IsOptional()
  @IsEnum(NextActionTypeEnum, {
    message: 'nextActionType must be one of: CALL, WHATSAPP, EMAIL, MEETING, PROPOSAL, INTERNAL_REVIEW',
  })
  nextActionType?: NextActionTypeEnum;

  @ApiPropertyOptional({
    description: 'Specific commercial objective or purpose of next action',
    example: 'Follow up on technical architecture requirements and timeline',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nextActionPurpose?: string;

  @ApiPropertyOptional({
    description: 'User UUID responsible for executing the action (Admin/Manager only)',
    example: 'a0000000-0000-0000-0000-000000000002',
  })
  @IsOptional()
  @IsUUID('4', { message: 'nextActionOwnerId must be a valid UUIDv4' })
  nextActionOwnerId?: string;
}
