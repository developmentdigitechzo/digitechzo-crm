// @ts-nocheck
import { HealthService } from '../src/modules/health/health.service';
import { PrismaService } from '../src/database/prisma.service';

describe('HealthService', () => {
  let healthService: HealthService;
  let prisma: Partial<PrismaService>;

  beforeEach(() => {
    prisma = {
      $queryRaw: jest.fn(),
    };
    healthService = new HealthService(prisma as PrismaService);
  });

  it('should return status "ok" and database "connected" when database responds', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ 1: 1 }]);

    const result = await healthService.check();

    expect(result.status).toBe('ok');
    expect(result.database.status).toBe('connected');
    expect(typeof result.database.latencyMs).toBe('number');
    expect(result.version).toBe('1.0.0');
    expect(result.environment).toBeDefined();
    expect(typeof result.uptime).toBe('number');
  });

  it('should return status "degraded" and database "disconnected" when database query fails', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection refused'));

    const result = await healthService.check();

    expect(result.status).toBe('degraded');
    expect(result.database.status).toBe('disconnected');
    expect(result.database.error).toContain('Connection refused');
  });
});

