import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connection initialized successfully.');
    } catch (error: any) {
      this.logger.warn(
        `Prisma database connection deferred or offline: ${error?.message || error}. Handled gracefully.`,
      );
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Database connection terminated cleanly.');
    } catch (error: any) {
      this.logger.error('Error during database disconnect', error);
    }
  }
}
