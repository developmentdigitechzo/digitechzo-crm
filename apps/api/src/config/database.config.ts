import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/digitechzo_crm?schema=public',
}));
