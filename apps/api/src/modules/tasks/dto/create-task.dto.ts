import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum TaskTypeEnum {
  CALL = 'CALL',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  PROPOSAL = 'PROPOSAL',
  FOLLOW_UP = 'FOLLOW_UP',
  REVIEW = 'REVIEW',
  OTHER = 'OTHER',
}

export enum TaskPriorityEnum {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class CreateTaskDto {
  @ApiProperty({ description: 'Task title or action summary', example: 'Follow up on technical proposal review' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiPropertyOptional({ description: 'Detailed context or agenda for the task', example: 'Review section 4 on SLA and pricing tiers' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiProperty({ enum: TaskTypeEnum, description: 'Type or modality of action', default: TaskTypeEnum.FOLLOW_UP })
  @IsEnum(TaskTypeEnum)
  taskType: TaskTypeEnum;

  @ApiProperty({ description: 'Scheduled due date/time (ISO 8601)', example: '2026-10-18T10:00:00.000Z' })
  @IsDateString({}, { message: 'dueDate must be a valid ISO 8601 date string' })
  dueDate: string;

  @ApiPropertyOptional({ enum: TaskPriorityEnum, description: 'Task execution urgency', default: TaskPriorityEnum.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriorityEnum)
  priority?: TaskPriorityEnum;

  @ApiPropertyOptional({ description: 'Assigned user UUID (defaults to creator; Admin/Manager can assign)', example: 'a0000000-0000-0000-0000-000000000002' })
  @IsOptional()
  @IsUUID('4')
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Associated lead UUID' })
  @IsOptional()
  @IsUUID('4')
  leadId?: string;

  @ApiPropertyOptional({ description: 'Associated deal UUID' })
  @IsOptional()
  @IsUUID('4')
  dealId?: string;
}
