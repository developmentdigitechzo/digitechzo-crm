import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskTypeEnum, TaskPriorityEnum } from './create-task.dto';
import { TaskStatusEnum } from './update-task.dto';

export class TaskQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search term for title and description' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ enum: TaskStatusEnum })
  @IsOptional()
  @IsEnum(TaskStatusEnum)
  status?: TaskStatusEnum;

  @ApiPropertyOptional({ enum: TaskPriorityEnum })
  @IsOptional()
  @IsEnum(TaskPriorityEnum)
  priority?: TaskPriorityEnum;

  @ApiPropertyOptional({ enum: TaskTypeEnum })
  @IsOptional()
  @IsEnum(TaskTypeEnum)
  taskType?: TaskTypeEnum;

  @ApiPropertyOptional({ description: 'Filter by assignee UUID' })
  @IsOptional()
  @IsUUID('4')
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Filter by lead UUID' })
  @IsOptional()
  @IsUUID('4')
  leadId?: string;

  @ApiPropertyOptional({ description: 'Filter by deal UUID' })
  @IsOptional()
  @IsUUID('4')
  dealId?: string;

  @ApiPropertyOptional({ description: 'Filter for overdue tasks (pending/in-progress with dueDate in the past)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  overdue?: boolean;

  @ApiPropertyOptional({ description: 'Filter for tasks due today' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  dueToday?: boolean;

  @ApiPropertyOptional({ description: 'Filter tasks with dueDate on or after this ISO date' })
  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter tasks with dueDate on or before this ISO date' })
  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @ApiPropertyOptional({ enum: ['dueDate', 'createdAt', 'priority', 'status'], default: 'dueDate' })
  @IsOptional()
  @IsEnum(['dueDate', 'createdAt', 'priority', 'status'])
  sortBy?: 'dueDate' | 'createdAt' | 'priority' | 'status' = 'dueDate';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}
