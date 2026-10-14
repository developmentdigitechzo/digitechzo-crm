import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../database/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('auth.jwtSecret') ||
        'digitechzo_jwt_access_secret_super_secure_key_b1_2026',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Malformed token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        status: true,
        organizationId: true,
        role: {
          select: {
            name: true,
            rolePermissions: {
              select: {
                permission: {
                  select: { resource: true, action: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    const liveRole = user.role?.name || payload.role;
    if (user.status !== 'ACTIVE' && liveRole !== 'ADMIN') {
      throw new UnauthorizedException('User account is inactive');
    }
    const livePermissions = user.role?.rolePermissions
      ? user.role.rolePermissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`)
      : payload.permissions || [];

    return {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId || payload.organizationId,
      role: liveRole,
      permissions: livePermissions,
    };
  }
}
