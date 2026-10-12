import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CreateAuditLogParams {
  organizationId: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(params: CreateAuditLogParams) {
    try {
      const auditLog = await this.prisma.auditLog.create({
        data: {
          organizationId: params.organizationId,
          userId: params.userId || null,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId || null,
          details: params.details || {},
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
          requestId: params.requestId || null,
        },
      });
      return auditLog;
    } catch (error: any) {
      this.logger.error(`Failed to record audit log: ${error.message || error}`, error.stack);
      // Audit log failures should not crash the main operational pipeline
      return null;
    }
  }

  async recordTx(tx: any, params: CreateAuditLogParams) {
    return tx.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId || null,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId || null,
        details: params.details || {},
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        requestId: params.requestId || null,
      },
    });
  }

  async findByOrganization(organizationId: string, limit: number = 50) {
    return this.prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}
