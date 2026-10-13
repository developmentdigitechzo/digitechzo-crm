import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User lacks sufficient permissions to access this resource');
    }

    // Administrators have full access across all modules
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return true;
    }

    if (!user.permissions || !Array.isArray(user.permissions)) {
      throw new ForbiddenException('User lacks sufficient permissions to access this resource');
    }

    const hasAllPermissions = requiredPermissions.every((perm) =>
      user.permissions.includes(perm),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Access denied: Missing required permission(s) [${requiredPermissions.join(', ')}]`,
      );
    }

    return true;
  }
}
