import { PrismaClient } from '@prisma/client';
import * as argon2 from '@node-rs/argon2';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('--- Starting DigiTechzo CRM B1 Database Seed ---');

  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'digitechzo' },
    update: {
      name: 'DigiTechzo Media & Technologies Pvt Ltd',
      status: 'ACTIVE',
    },
    create: {
      name: 'DigiTechzo Media & Technologies Pvt Ltd',
      slug: 'digitechzo',
      status: 'ACTIVE',
    },
  });
  console.log(`[Seed] Organization configured: ${org.name} (${org.id})`);

  // 2. Roles
  const rolesData = [
    { name: 'ADMIN', description: 'Full system administration and control', isSystem: true },
    { name: 'MANAGER', description: 'Team management, pipeline approvals, and reporting', isSystem: true },
    { name: 'BDE_SALES', description: 'Business development, leads, deals, and tasks', isSystem: true },
    { name: 'MARKETING', description: 'Campaign management and inbound lead qualification', isSystem: true },
    { name: 'DELIVERY', description: 'Customer onboarding and service delivery handoff', isSystem: true },
  ];

  const rolesMap = new Map<string, string>();
  for (const r of rolesData) {
    const roleRecord = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description, isSystem: r.isSystem },
      create: r,
    });
    rolesMap.set(r.name, roleRecord.id);
  }
  console.log(`[Seed] ${rolesMap.size} system roles ensured.`);

  // 3. Permissions
  const permissionsData = [
    { resource: 'users', action: 'read', description: 'View user accounts' },
    { resource: 'users', action: 'create', description: 'Create user accounts' },
    { resource: 'users', action: 'update', description: 'Update user accounts' },
    { resource: 'users', action: 'delete', description: 'Deactivate user accounts' },
    { resource: 'roles', action: 'read', description: 'View roles and permissions' },
    { resource: 'roles', action: 'update', description: 'Modify role permission assignments' },
    { resource: 'audit_logs', action: 'read', description: 'View security audit logs' },
    { resource: 'settings', action: 'read', description: 'View system configuration' },
    { resource: 'settings', action: 'update', description: 'Update system configuration' },
    { resource: 'leads', action: 'read', description: 'View CRM leads' },
    { resource: 'leads', action: 'create', description: 'Create new leads' },
    { resource: 'leads', action: 'update', description: 'Update existing leads' },
    { resource: 'leads', action: 'delete', description: 'Archive/delete leads' },
    { resource: 'deals', action: 'read', description: 'View pipeline deals' },
    { resource: 'deals', action: 'create', description: 'Create deals' },
    { resource: 'deals', action: 'update', description: 'Update deals' },
    { resource: 'deals', action: 'delete', description: 'Archive deals' },
    { resource: 'tasks', action: 'read', description: 'View task queue' },
    { resource: 'tasks', action: 'create', description: 'Create tasks' },
    { resource: 'tasks', action: 'update', description: 'Update tasks' },
    { resource: 'tasks', action: 'delete', description: 'Delete tasks' },
    { resource: 'activities', action: 'read', description: 'View activity timeline' },
    { resource: 'activities', action: 'create', description: 'Create activity logs' },
    { resource: 'activities', action: 'update', description: 'Update activities' },
    { resource: 'activities', action: 'delete', description: 'Delete activities' },
    { resource: 'meetings', action: 'read', description: 'View scheduled meetings and demos' },
    { resource: 'meetings', action: 'create', description: 'Schedule new meetings and demos' },
    { resource: 'meetings', action: 'update', description: 'Update meeting details and status' },
    { resource: 'meetings', action: 'delete', description: 'Cancel/delete meetings' },
    { resource: 'proposals', action: 'read', description: 'View quotations and proposals' },
    { resource: 'proposals', action: 'create', description: 'Create new proposals' },
    { resource: 'proposals', action: 'update', description: 'Update proposals and status' },
    { resource: 'proposals', action: 'delete', description: 'Delete proposals' },
    { resource: 'customers', action: 'read', description: 'View customer accounts' },
    { resource: 'customers', action: 'create', description: 'Create/convert customers' },
    { resource: 'customers', action: 'update', description: 'Update customer details' },
    { resource: 'customers', action: 'delete', description: 'Deactivate/delete customers' },
    { resource: 'invoices', action: 'read', description: 'View invoices and billing records' },
    { resource: 'invoices', action: 'create', description: 'Generate new invoices' },
    { resource: 'invoices', action: 'update', description: 'Update invoices and statuses' },
    { resource: 'invoices', action: 'delete', description: 'Delete invoices' },
    { resource: 'reports', action: 'read', description: 'View executive analytics' },
  ];

  const permMap = new Map<string, string>();
  for (const p of permissionsData) {
    const permRecord = await prisma.permission.upsert({
      where: { resource_action: { resource: p.resource, action: p.action } },
      update: { description: p.description },
      create: p,
    });
    permMap.set(`${p.resource}:${p.action}`, permRecord.id);
  }
  console.log(`[Seed] ${permMap.size} permissions registered.`);

  // 4. RolePermission Assignments
  const adminRoleId = rolesMap.get('ADMIN')!;
  for (const permId of permMap.values()) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRoleId, permissionId: permId } },
      update: {},
      create: { roleId: adminRoleId, permissionId: permId },
    });
  }

  // Manager permissions
  const managerPerms = [
    'users:read', 'users:create', 'users:update', 'users:delete',
    'roles:read', 'audit_logs:read', 'settings:read',
    'leads:read', 'leads:create', 'leads:update',
    'deals:read', 'deals:create', 'deals:update',
    'tasks:read', 'tasks:create', 'tasks:update',
    'activities:read', 'activities:create', 'activities:update',
    'meetings:read', 'meetings:create', 'meetings:update',
    'proposals:read', 'proposals:create', 'proposals:update',
    'customers:read', 'customers:create', 'customers:update',
    'invoices:read', 'invoices:create', 'invoices:update', 'invoices:delete',
    'reports:read',
  ];
  const managerRoleId = rolesMap.get('MANAGER')!;
  for (const permKey of managerPerms) {
    const permId = permMap.get(permKey);
    if (permId) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: managerRoleId, permissionId: permId } },
        update: {},
        create: { roleId: managerRoleId, permissionId: permId },
      });
    }
  }

  // BDE Sales permissions
  const bdePerms = [
    'users:read', 'users:create', 'users:update', 'users:delete',
    'leads:read', 'leads:create', 'leads:update',
    'deals:read', 'deals:create', 'deals:update',
    'tasks:read', 'tasks:create', 'tasks:update',
    'activities:read', 'activities:create', 'activities:update',
    'meetings:read', 'meetings:create', 'meetings:update',
    'proposals:read', 'proposals:create', 'proposals:update',
    'customers:read', 'customers:create', 'customers:update',
    'invoices:read', 'invoices:create', 'invoices:update',
    'reports:read',
  ];
  const bdeRoleId = rolesMap.get('BDE_SALES')!;
  for (const permKey of bdePerms) {
    const permId = permMap.get(permKey);
    if (permId) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: bdeRoleId, permissionId: permId } },
        update: {},
        create: { roleId: bdeRoleId, permissionId: permId },
      });
    }
  }
  console.log('[Seed] Role-permission matrices mapped.');

  // 5. Reference Pipeline Stages
  const stages = [
    { name: 'New Lead (Qualification)', order: 1, stageType: 'OPEN', dealCountBenchmark: 8, totalValueBenchmark: 2400000 },
    { name: 'Discovery & Requirement Discussion', order: 2, stageType: 'OPEN', dealCountBenchmark: 5, totalValueBenchmark: 1750000 },
    { name: 'Demo / Meeting Completed', order: 3, stageType: 'OPEN', dealCountBenchmark: 4, totalValueBenchmark: 1600000 },
    { name: 'Proposal Sent', order: 4, stageType: 'OPEN', dealCountBenchmark: 4, totalValueBenchmark: 1500000 },
    { name: 'Negotiation', order: 5, stageType: 'OPEN', dealCountBenchmark: 3, totalValueBenchmark: 1200000 },
    { name: 'Closed Won', order: 6, stageType: 'WON', dealCountBenchmark: 2, totalValueBenchmark: 950000 },
    { name: 'Closed Lost', order: 7, stageType: 'LOST', dealCountBenchmark: 6, totalValueBenchmark: 1850000 },
  ];
  for (const s of stages) {
    const existing = await prisma.pipelineStage.findFirst({ where: { order: s.order } });
    if (!existing) {
      await prisma.pipelineStage.create({ data: s });
    } else {
      await prisma.pipelineStage.update({
        where: { id: existing.id },
        data: s,
      });
    }
  }
  console.log(`[Seed] ${stages.length} pipeline reference stages seeded.`);

  // 6. Reference Lost Reasons
  const lostReasons = [
    { code: 'PRICE_TOO_HIGH', label: 'Price too high / Budget constraint' },
    { code: 'COMPETITOR_CHOSEN', label: 'Selected alternative competitor' },
    { code: 'TIMING_POSTPONED', label: 'Project postponed or deprioritized' },
    { code: 'POOR_FIT', label: 'Requirements outside current technical capabilities' },
    { code: 'UNRESPONSIVE', label: 'Prospect stopped responding after follow-ups' },
  ];
  for (const lr of lostReasons) {
    await prisma.lostReason.upsert({
      where: { code: lr.code },
      update: { label: lr.label, isActive: true },
      create: { code: lr.code, label: lr.label, isActive: true },
    });
  }
  console.log(`[Seed] ${lostReasons.length} reference lost reasons configured.`);

  // 7. Initial Administrator User
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@digitechzo.com';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminSecurePassword123!';
  const adminName = process.env.INITIAL_ADMIN_NAME || 'DigiTechzo Administrator';

  const passwordHash = await argon2.hash(adminPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      roleId: adminRoleId,
      organizationId: org.id,
      status: 'ACTIVE',
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      roleId: adminRoleId,
      organizationId: org.id,
      status: 'ACTIVE',
    },
  });
  console.log(`[Seed] Admin user seeded: ${adminUser.email} (${adminUser.id})`);

  console.log('--- DigiTechzo CRM B1 Database Seed Completed Successfully ---');
}

if (require.main === module) {
  seedDatabase()
    .catch((err) => {
      console.error('Seed execution failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
