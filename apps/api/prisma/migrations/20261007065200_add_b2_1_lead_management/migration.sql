-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "company_name" TEXT,
    "title" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "temperature" TEXT,
    "lead_score" INTEGER,
    "service_interest" TEXT NOT NULL,
    "unqualified_reason" TEXT,
    "unqualified_notes" TEXT,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "next_action_due_at" TIMESTAMP(3),
    "next_action_type" TEXT,
    "next_action_purpose" TEXT,
    "next_action_owner_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_qualifications" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "budget_amount" DECIMAL(12,2),
    "budget_status" TEXT,
    "authority_level" TEXT,
    "timeline_horizon" TEXT,
    "urgency_rating" INTEGER DEFAULT 3,
    "problem_statement" TEXT,
    "notes" TEXT,
    "qualified_by_user_id" TEXT,
    "qualified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_qualifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_organization_id_idx" ON "leads"("organization_id");

-- CreateIndex
CREATE INDEX "leads_owner_id_idx" ON "leads"("owner_id");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_priority_idx" ON "leads"("priority");

-- CreateIndex
CREATE INDEX "leads_source_idx" ON "leads"("source");

-- CreateIndex
CREATE INDEX "leads_phone_idx" ON "leads"("phone");

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "leads"("email");

-- CreateIndex
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");

-- CreateIndex
CREATE INDEX "leads_last_activity_at_idx" ON "leads"("last_activity_at");

-- CreateIndex
CREATE INDEX "leads_next_action_due_at_idx" ON "leads"("next_action_due_at");

-- CreateIndex
CREATE UNIQUE INDEX "lead_qualifications_lead_id_key" ON "lead_qualifications"("lead_id");

-- CreateIndex
CREATE INDEX "lead_qualifications_lead_id_idx" ON "lead_qualifications"("lead_id");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_next_action_owner_id_fkey" FOREIGN KEY ("next_action_owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_qualifications" ADD CONSTRAINT "lead_qualifications_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_qualifications" ADD CONSTRAINT "lead_qualifications_qualified_by_user_id_fkey" FOREIGN KEY ("qualified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
