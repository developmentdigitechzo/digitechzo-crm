import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_ACCESS_SECRET || 'digitechzo_jwt_access_secret_super_secure_key_b1_2026',
  jwtExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  refreshExpirationDays: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS || '7', 10),
  initialAdminEmail: process.env.INITIAL_ADMIN_EMAIL || 'admin@digitechzo.com',
  initialAdminPassword: process.env.INITIAL_ADMIN_PASSWORD || 'AdminSecurePassword123!',
  initialAdminName: process.env.INITIAL_ADMIN_NAME || 'DigiTechzo Administrator',
}));
