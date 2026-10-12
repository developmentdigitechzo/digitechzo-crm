import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskResponseDto, PaginatedTasksResponseDto } from './dto/task-response.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Tasks')
@ApiBearerAuth('JWT-auth')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @Permissions('tasks:read')
  @ApiOperation({ summary: 'List tasks with filtering, search, pagination, and ownership scoping' })
  @ApiResponse({ status: 200, type: PaginatedTasksResponseDto })
  async findAll(
    @Query() query: TaskQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedTasksResponseDto> {
    return this.tasksService.findAll(query, user);
  }

  @Get(':id')
  @Permissions('tasks:read')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TaskResponseDto> {
    return this.tasksService.findById(id, user);
  }

  @Post()
  @Permissions('tasks:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new task / follow-up item' })
  @ApiResponse({ status: 201, type: TaskResponseDto })
  async create(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TaskResponseDto> {
    return this.tasksService.create(dto, user);
  }

  @Patch(':id')
  @Permissions('tasks:update')
  @ApiOperation({ summary: 'Update task properties' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TaskResponseDto> {
    return this.tasksService.update(id, dto, user);
  }

  @Post(':id/complete')
  @Permissions('tasks:update')
  @ApiOperation({ summary: 'Mark a task as completed with optional completion notes and activity log' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TaskResponseDto> {
    return this.tasksService.complete(id, dto, user);
  }

  @Post(':id/reopen')
  @Permissions('tasks:update')
  @ApiOperation({ summary: 'Reopen a previously completed or cancelled task back to pending' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  async reopen(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TaskResponseDto> {
    return this.tasksService.reopen(id, user);
  }

  @Post(':id/assign')
  @Permissions('tasks:update')
  @ApiOperation({ summary: 'Reassign task to another user within the organization (Admin/Manager only)' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TaskResponseDto> {
    return this.tasksService.assign(id, dto, user);
  }

  @Delete(':id')
  @Permissions('tasks:delete')
  @ApiOperation({ summary: 'Soft-delete a task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.tasksService.remove(id, user);
  }
}
