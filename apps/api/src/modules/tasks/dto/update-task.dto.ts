import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { TaskTypeEnum, TaskPriorityEnum } from './create-task.dto';

export enum TaskStatusEnum {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'Task title or action summary' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiPropertyOptional({ description: 'Detailed context or agenda' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({ enum: TaskTypeEnum, description: 'Type or modality of action' })
  @IsOptional()
  @IsEnum(TaskTypeEnum)
  taskType?: TaskTypeEnum;

  @ApiPropertyOptional({ description: 'Scheduled due date/time (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'dueDate must be a valid ISO 8601 date string' })
  dueDate?: string;

  @ApiPropertyOptional({ enum: TaskPriorityEnum, description: 'Task urgency level' })
  @IsOptional()
  @IsEnum(TaskPriorityEnum)
  priority?: TaskPriorityEnum;

  @ApiPropertyOptional({ enum: TaskStatusEnum, description: 'Task status' })
  @IsOptional()
  @IsEnum(TaskStatusEnum)
  status?: TaskStatusEnum;

  @ApiPropertyOptional({ description: 'Associated lead UUID' })
  @IsOptional()
  @IsUUID('4')
  leadId?: string;

  @ApiPropertyOptional({ description: 'Associated deal UUID' })
  @IsOptional()
  @IsUUID('4')
  dealId?: string;
}
