import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface HealthCheckResult {
  status: 'ok' | 'degraded';
  version: string;
  timestamp: string;
  uptime: number;
  environment: string;
  database: {
    status: 'connected' | 'disconnected';
    latencyMs?: number;
    error?: string;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    let dbLatency: number | undefined;
    let dbError: string | undefined;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
      dbLatency = Date.now() - startTime;
    } catch (err: any) {
      dbStatus = 'disconnected';
      dbError = err?.message || 'Database unreachable';
      this.logger.warn(`Health check database probe warning: ${dbError}`);
    }

    const overallStatus: 'ok' | 'degraded' = dbStatus === 'connected' ? 'ok' : 'degraded';

    return {
      status: overallStatus,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
        error: dbError,
      },
    };
  }
}
