const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const mode = process.argv[2] || 'status';

  const backupsDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
  const backupFile = path.join(backupsDir, 'activities_backup.json');

  if (mode === 'clear' || mode === 'delete') {
    const deleteResult = await prisma.activity.deleteMany({});
    console.log(`Deleted ${deleteResult.count} activities from database.`);
  } else if (mode === 'restore' || mode === 'undo') {
    console.log('Restoring activities from AuditLog history...');

    // Load active IDs to satisfy foreign keys
    const validLeads = new Set((await prisma.lead.findMany({ select: { id: true } })).map((l) => l.id));
    const validDeals = new Set((await prisma.deal.findMany({ select: { id: true } })).map((d) => d.id));
    const validUsers = new Set((await prisma.user.findMany({ select: { id: true } })).map((u) => u.id));
    const defaultUser = Array.from(validUsers)[0];

    const auditEntries = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            'ACTIVITY_CREATED',
            'DEAL_STAGE_CHANGED',
            'LEAD_CREATED',
            'MEETING_SCHEDULED',
            'TASK_CREATED',
          ],
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`Found ${auditEntries.length} relevant audit records.`);
    const itemsToRestore = [];

    for (const entry of auditEntries) {
      const d = entry.details || {};
      let actType = d.activityType || 'NOTE';
      let subject = d.subject;
      let desc = d.description;

      if (entry.action === 'DEAL_STAGE_CHANGED') {
        actType = 'NOTE';
        subject = `Pipeline Stage Changed: ${d.newStageName || 'Updated Stage'}`;
        desc = `Deal moved from previous stage to "${d.newStageName || 'New Stage'}". Stage order: ${d.newStageOrder || 1}. Status: OPEN`;
      } else if (entry.action === 'LEAD_CREATED') {
        actType = 'SYSTEM';
        subject = 'Lead Captured';
        desc = `New lead created. Source: ${d.source || 'Direct'}. Service: ${d.serviceInterest || 'General Inquiry'}`;
      } else if (entry.action === 'MEETING_SCHEDULED') {
        actType = 'MEETING';
        subject = `Meeting Scheduled: ${d.title || 'Discovery Call'}`;
        desc = d.description || 'Discovery Call scheduled';
      } else if (entry.action === 'TASK_CREATED') {
        actType = 'TASK';
        subject = `Task Created: ${d.title || 'Follow-up'}`;
        desc = d.description || 'Sales follow-up action';
      }

      if (!subject) continue;

      const rawLeadId = d.leadId || (entry.resource === 'leads' ? entry.resourceId : null);
      const rawDealId = d.dealId || (entry.resource === 'deals' ? entry.resourceId : null);

      itemsToRestore.push({
        id: entry.resourceId && entry.action === 'ACTIVITY_CREATED' ? entry.resourceId : entry.id,
        organizationId: entry.organizationId,
        userId: validUsers.has(entry.userId) ? entry.userId : defaultUser,
        leadId: rawLeadId && validLeads.has(rawLeadId) ? rawLeadId : null,
        dealId: rawDealId && validDeals.has(rawDealId) ? rawDealId : null,
        taskId: null,
        meetingId: null,
        activityType: actType,
        direction: d.direction || null,
        subject: subject,
        description: desc || null,
        activityDate: entry.createdAt,
        durationSeconds: d.durationSeconds || null,
        outcome: d.outcome || null,
        metadata: d,
        createdAt: entry.createdAt,
        updatedAt: entry.createdAt,
      });
    }

    fs.writeFileSync(backupFile, JSON.stringify(itemsToRestore, null, 2), 'utf-8');

    await prisma.activity.deleteMany({});
    const result = await prisma.activity.createMany({
      data: itemsToRestore,
      skipDuplicates: true,
    });

    console.log(`Successfully restored ${result.count} activities into the database!`);
  } else if (mode === 'status') {
    const count = await prisma.activity.count();
    console.log(`Current activities in DB: ${count}`);
    console.log(`Backup file exists: ${fs.existsSync(backupFile)}`);
  }
}

main()
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
