import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheckResult, HealthService } from './health.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Check API and database health status',
    description: 'Returns operational uptime, environment, and PostgreSQL database connectivity status.',
  })
  @ApiResponse({
    status: 200,
    description: 'System health status evaluated',
  })
  async getHealth(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }
}
