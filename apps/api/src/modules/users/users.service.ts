import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PermissionsService } from '../permissions/permissions.service';
import { UserProfileDto } from './dto/user-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        role: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
        role: true,
      },
    });
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    const permissions = await this.permissionsService.findByRole(user.roleId);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
        status: user.organization.status,
      },
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description || undefined,
      },
      permissions,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
