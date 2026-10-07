import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { ROLES_KEY } from '../src/common/decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../src/common/decorators/permissions.decorator';

describe('RBAC & Authorization Guards', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  describe('RolesGuard', () => {
    let guard: RolesGuard;

    beforeEach(() => {
      guard = new RolesGuard(reflector);
    });

    it('should allow access when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = createMockContext({ role: 'BDE_SALES' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when user role is in required roles list', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'MANAGER']);
      const context = createMockContext({ role: 'ADMIN' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException when user lacks the required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
      const context = createMockContext({ role: 'BDE_SALES' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user has no role defined', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
      const context = createMockContext({});

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('PermissionsGuard', () => {
    let guard: PermissionsGuard;

    beforeEach(() => {
      guard = new PermissionsGuard(reflector);
    });

    it('should allow access when no permissions are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = createMockContext({ permissions: [] });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when user possesses all required permissions', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users:read', 'users:create']);
      const context = createMockContext({
        permissions: ['users:read', 'users:create', 'leads:read'],
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException when user lacks one or more required permissions', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users:delete']);
      const context = createMockContext({
        permissions: ['users:read', 'users:create'],
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
