import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../src/modules/auth/auth.service';
import { PrismaService } from '../src/database/prisma.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { PermissionsService } from '../src/modules/permissions/permissions.service';
import { MailService } from '../src/modules/mail/mail.service';
import * as argon2 from '@node-rs/argon2';
import * as crypto from 'crypto';

describe('AuthService (Authentication & Token Rotation)', () => {
  let authService: AuthService;
  let prisma: Partial<PrismaService>;
  let jwtService: Partial<JwtService>;
  let configService: Partial<ConfigService>;
  let auditService: Partial<AuditService>;
  let permissionsService: Partial<PermissionsService>;
  let mailService: Partial<MailService>;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'admin@digitechzo.com',
    name: 'DigiTechzo Admin',
    passwordHash: '',
    status: 'ACTIVE',
    organizationId: 'org-uuid-1',
    roleId: 'role-uuid-1',
    organization: {
      id: 'org-uuid-1',
      name: 'DigiTechzo Media & Technologies Pvt Ltd',
      slug: 'digitechzo',
    },
    role: {
      id: 'role-uuid-1',
      name: 'ADMIN',
    },
  };

  beforeAll(async () => {
    // Generate actual Argon2id hash for testing verification
    mockUser.passwordHash = await argon2.hash('AdminSecurePassword123!');
  });

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      } as any,
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'rt-uuid-1' }),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 'rt-uuid-1', isRevoked: true }),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      } as any,
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked.jwt.access.token'),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'auth.refreshExpirationDays') return 7;
        return null;
      }),
    };

    auditService = {
      record: jest.fn().mockResolvedValue({ id: 'audit-log-uuid' }),
    };

    permissionsService = {
      findByRole: jest.fn().mockResolvedValue(['users:read', 'users:create']),
    };

    mailService = {
      sendPasswordResetOtp: jest.fn().mockResolvedValue(true),
    };

    authService = new AuthService(
      prisma as PrismaService,
      jwtService as JwtService,
      configService as ConfigService,
      auditService as AuditService,
      permissionsService as PermissionsService,
      mailService as MailService,
    );
  });

  describe('Login', () => {
    it('should authenticate user and return access token, refresh token, and user info', async () => {
      (prisma.user!.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.login(
        { email: 'admin@digitechzo.com', password: 'AdminSecurePassword123!' },
        '127.0.0.1',
        'Mozilla/5.0',
        'req-123',
      );

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mocked.jwt.access.token');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.refreshToken.length).toBe(96); // 48 bytes hex is 96 chars
      expect(result.user.email).toBe('admin@digitechzo.com');
      expect(result.user.role).toBe('ADMIN');
      expect(result.user.permissions).toEqual(['users:read', 'users:create']);

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN_SUCCESS',
          userId: mockUser.id,
        }),
      );
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      (prisma.user!.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        authService.login({
          email: 'admin@digitechzo.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN_FAILED',
        }),
      );
    });

    it('should throw ForbiddenException if user status is INACTIVE', async () => {
      (prisma.user!.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        status: 'INACTIVE',
      });

      await expect(
        authService.login({
          email: 'admin@digitechzo.com',
          password: 'AdminSecurePassword123!',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Refresh Token Rotation & Reuse Detection', () => {
    it('should rotate valid refresh token into a new token pair and revoke the previous token', async () => {
      const rawRefreshToken = 'a'.repeat(96);
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

      const existingRecord = {
        id: 'rt-1',
        userId: mockUser.id,
        tokenHash,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // tomorrow
        user: mockUser,
      };

      (prisma.refreshToken!.findUnique as jest.Mock).mockResolvedValue(existingRecord);

      const result = await authService.refresh({ refreshToken: rawRefreshToken });

      expect(result.accessToken).toBe('mocked.jwt.access.token');
      expect(typeof result.refreshToken).toBe('string');
      // The old token record must be revoked
      expect(prisma.refreshToken!.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rt-1' },
          data: expect.objectContaining({ isRevoked: true }),
        }),
      );
      // New refresh token created
      expect(prisma.refreshToken!.create).toHaveBeenCalled();
      // Rotation audit logged
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'REFRESH_TOKEN_ROTATED',
        }),
      );
    });

    it('should detect reuse of revoked token, revoke all user sessions, and throw UnauthorizedException', async () => {
      const rawRefreshToken = 'b'.repeat(96);
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

      const compromisedRecord = {
        id: 'rt-compromised',
        userId: mockUser.id,
        tokenHash,
        isRevoked: true, // ALREADY REVOKED!
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        user: mockUser,
      };

      (prisma.refreshToken!.findUnique as jest.Mock).mockResolvedValue(compromisedRecord);

      await expect(
        authService.refresh({ refreshToken: rawRefreshToken }),
      ).rejects.toThrow(UnauthorizedException);

      // Verify all active tokens were wiped for this user
      expect(prisma.refreshToken!.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.id, isRevoked: false },
          data: expect.objectContaining({ isRevoked: true }),
        }),
      );

      // Security alert audit logged
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SECURITY_ALERT_REFRESH_TOKEN_REUSE',
        }),
      );
    });
  });

  describe('Logout', () => {
    it('should revoke user refresh tokens and log session exit', async () => {
      (prisma.user!.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.logout(mockUser.id);
      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(prisma.refreshToken!.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.id, isRevoked: false },
          data: expect.objectContaining({ isRevoked: true }),
        }),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGOUT',
          userId: mockUser.id,
        }),
      );
    });
  });
});
