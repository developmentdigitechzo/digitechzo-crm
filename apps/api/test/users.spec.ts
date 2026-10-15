// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../src/modules/users/users.service';
import { UsersController } from '../src/modules/users/users.controller';
import { RolesService } from '../src/modules/roles/roles.service';
import { RolesController } from '../src/modules/roles/roles.controller';
import { PrismaService } from '../src/database/prisma.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { PermissionsService } from '../src/modules/permissions/permissions.service';
import { AuthenticatedUser } from '../src/common/decorators/current-user.decorator';

describe('B2.8 Users & Team Unit and Integration Suite', () => {
  let usersService: UsersService;
  let usersController: UsersController;
  let rolesService: RolesService;
  let rolesController: RolesController;
  let prisma: any;
  let auditService: any;

  const mockAdminUser: AuthenticatedUser = {
    userId: 'admin-uuid-1',
    email: 'admin@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'ADMIN',
    permissions: ['users:read', 'users:create', 'users:update', 'users:delete', 'roles:read'],
  };

  const mockManagerUser: AuthenticatedUser = {
    userId: 'manager-uuid-1',
    email: 'manager@digitechzo.com',
    organizationId: 'org-tenant-1',
    role: 'MANAGER',
    permissions: ['users:read'],
  };

  const mockOtherTenantAdmin: AuthenticatedUser = {
    userId: 'admin-uuid-2',
    email: 'admin@other.com',
    organizationId: 'org-tenant-2',
    role: 'ADMIN',
    permissions: ['users:read', 'users:create', 'users:update', 'users:delete'],
  };

  const mockRoleBde = {
    id: 'role-bde-id',
    name: 'BDE_SALES',
    description: 'Business Development Executive',
    isSystem: true,
    createdAt: new Date(),
  };

  const mockRoleAdmin = {
    id: 'role-admin-id',
    name: 'ADMIN',
    description: 'Administrator',
    isSystem: true,
    createdAt: new Date(),
  };

  const mockUserRecord = {
    id: 'user-sample-1',
    organizationId: 'org-tenant-1',
    roleId: 'role-bde-id',
    name: 'Neha Kulkarni',
    email: 'neha.k@digitechzo.com',
    phone: '+919812345678',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$somehash',
    status: 'ACTIVE',
    createdAt: new Date('2026-10-01T00:00:00Z'),
    updatedAt: new Date('2026-10-01T00:00:00Z'),
    role: mockRoleBde,
    organization: {
      id: 'org-tenant-1',
      name: 'DigiTechzo Media & Technologies',
      slug: 'digitechzo',
      status: 'ACTIVE',
    },
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      role: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    auditService = {
      record: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController, RolesController],
      providers: [
        UsersService,
        RolesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: PermissionsService, useValue: { findByRole: jest.fn().mockResolvedValue([]) } },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    usersController = module.get<UsersController>(UsersController);
    rolesService = module.get<RolesService>(RolesService);
    rolesController = module.get<RolesController>(RolesController);
  });

  describe('1. GET /api/v1/users (Listing & Organization Isolation)', () => {
    it('should return paginated users belonging strictly to authenticated user organization', async () => {
      prisma.user.findMany.mockResolvedValue([mockUserRecord]);
      prisma.user.count.mockResolvedValue(1);

      const result = await usersController.findAll({}, mockAdminUser);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: 'org-tenant-1' }),
        })
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('user-sample-1');
      expect(result.data[0].firstName).toBe('Neha');
      expect(result.data[0].lastName).toBe('Kulkarni');
      expect(result.data[0].role.displayAlias).toBe('BDE');
      // Verify passwordHash is never returned
      expect((result.data[0] as any).passwordHash).toBeUndefined();
    });

    it('should isolate users by organization context and never leak cross-tenant records', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      const result = await usersController.findAll({}, mockOtherTenantAdmin);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: 'org-tenant-2' }),
        })
      );
      expect(result.data).toHaveLength(0);
    });
  });

  describe('2. GET /api/v1/users/:id', () => {
    it('should return user details within the same organization', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUserRecord);

      const result = await usersController.findById('user-sample-1', mockAdminUser);

      expect(result.id).toBe('user-sample-1');
      expect(result.email).toBe('neha.k@digitechzo.com');
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('should throw 404 NotFound if user belongs to another organization', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        usersController.findById('user-sample-1', mockOtherTenantAdmin)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('3. POST /api/v1/users (Create / Invite User)', () => {
    it('should create user with Argon2id hash and audit record', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null); // email check
      prisma.role.findUnique.mockResolvedValueOnce(mockRoleBde); // role check
      prisma.user.create.mockResolvedValue({
        ...mockUserRecord,
        id: 'new-user-uuid',
      });

      const dto = {
        firstName: 'Neha',
        lastName: 'Kulkarni',
        email: 'neha.k@digitechzo.com',
        role: 'BDE',
      };

      const result = await usersController.create(dto, mockAdminUser);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-tenant-1',
            email: 'neha.k@digitechzo.com',
            name: 'Neha Kulkarni',
            roleId: 'role-bde-id',
            passwordHash: expect.stringMatching(/^\$argon2id\$/),
            status: 'ACTIVE',
          }),
        })
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_CREATED',
          organizationId: 'org-tenant-1',
          resource: 'users',
        })
      );
      expect(result.id).toBe('new-user-uuid');
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('should reject creation with 409 Conflict if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(mockUserRecord);

      const dto = {
        name: 'Duplicate Test',
        email: 'neha.k@digitechzo.com',
      };

      await expect(usersController.create(dto, mockAdminUser)).rejects.toThrow(
        ConflictException
      );
    });

    it('should reject creation with 400 Bad Request if role is invalid', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.role.findUnique.mockResolvedValueOnce(null); // role not found

      const dto = {
        name: 'Invalid Role Test',
        email: 'unique@digitechzo.com',
        role: 'NON_EXISTENT_ROLE',
      };

      await expect(usersController.create(dto, mockAdminUser)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should prevent non-admin from creating an ADMIN user', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.role.findUnique.mockResolvedValueOnce(mockRoleAdmin);

      const dto = {
        name: 'Admin Creation Test',
        email: 'hacker@digitechzo.com',
        role: 'ADMIN',
      };

      await expect(usersController.create(dto, mockManagerUser)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('4. PATCH /api/v1/users/:id (Update User)', () => {
    it('should update user fields and audit changes', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUserRecord);
      prisma.user.update.mockResolvedValue({
        ...mockUserRecord,
        name: 'Neha Sharma',
        phone: '+919988776655',
      });

      const result = await usersController.update(
        'user-sample-1',
        { name: 'Neha Sharma', phone: '+919988776655' },
        mockAdminUser
      );

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-sample-1' },
          data: expect.objectContaining({
            name: 'Neha Sharma',
            phone: '+919988776655',
          }),
        })
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_UPDATED',
          resource: 'users',
        })
      );
      expect(result.firstName).toBe('Neha');
      expect(result.lastName).toBe('Sharma');
    });

    it('should throw 404 when updating user in different organization', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        usersController.update('user-sample-1', { name: 'Cross Org' }, mockOtherTenantAdmin)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('5. DELETE /api/v1/users/:id (Deactivate User)', () => {
    it('should set status to INACTIVE without physical record deletion', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUserRecord);
      prisma.user.update.mockResolvedValue({
        ...mockUserRecord,
        status: 'INACTIVE',
      });

      const result = await usersController.remove('user-sample-1', mockAdminUser);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-sample-1' },
        data: { status: 'INACTIVE' },
      });
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_DEACTIVATED',
          resource: 'users',
        })
      );
      expect(result.message).toContain('deactivated successfully');
    });

    it('should prevent user self-deactivation', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUserRecord);

      await expect(
        usersController.remove('admin-uuid-1', mockAdminUser)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('6. GET /api/v1/roles', () => {
    it('should return safe system roles with display aliases', async () => {
      prisma.role.findMany.mockResolvedValue([mockRoleAdmin, mockRoleBde]);

      const result = await rolesController.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('ADMIN');
      expect(result[0].displayAlias).toBe('ADMIN');
      expect(result[1].name).toBe('BDE_SALES');
      expect(result[1].displayAlias).toBe('BDE');
    });
  });
});

