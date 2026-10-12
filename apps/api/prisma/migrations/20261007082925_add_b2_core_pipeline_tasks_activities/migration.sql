-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "stage_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "expected_close_date" TIMESTAMP(3),
    "probability" INTEGER DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "lost_reason_id" TEXT,
    "lost_reason_notes" TEXT,
    "closed_at" TIMESTAMP(3),
    "won_notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "assignee_id" TEXT NOT NULL,
    "creator_id" TEXT,
    "lead_id" TEXT,
    "deal_id" TEXT,
    "task_type" TEXT NOT NULL DEFAULT 'FOLLOW_UP',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3) NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMP(3),
    "completion_notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "deal_id" TEXT,
    "task_id" TEXT,
    "activity_type" TEXT NOT NULL,
    "direction" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "activity_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration_seconds" INTEGER,
    "outcome" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deals_organization_id_idx" ON "deals"("organization_id");

-- CreateIndex
CREATE INDEX "deals_owner_id_idx" ON "deals"("owner_id");

-- CreateIndex
CREATE INDEX "deals_lead_id_idx" ON "deals"("lead_id");

-- CreateIndex
CREATE INDEX "deals_stage_id_idx" ON "deals"("stage_id");

-- CreateIndex
CREATE INDEX "deals_status_idx" ON "deals"("status");

-- CreateIndex
CREATE INDEX "deals_expected_close_date_idx" ON "deals"("expected_close_date");

-- CreateIndex
CREATE INDEX "deals_created_at_idx" ON "deals"("created_at");

-- CreateIndex
CREATE INDEX "tasks_organization_id_idx" ON "tasks"("organization_id");

-- CreateIndex
CREATE INDEX "tasks_assignee_id_idx" ON "tasks"("assignee_id");

-- CreateIndex
CREATE INDEX "tasks_lead_id_idx" ON "tasks"("lead_id");

-- CreateIndex
CREATE INDEX "tasks_deal_id_idx" ON "tasks"("deal_id");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");

-- CreateIndex
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");

-- CreateIndex
CREATE INDEX "tasks_created_at_idx" ON "tasks"("created_at");

-- CreateIndex
CREATE INDEX "activities_organization_id_idx" ON "activities"("organization_id");

-- CreateIndex
CREATE INDEX "activities_user_id_idx" ON "activities"("user_id");

-- CreateIndex
CREATE INDEX "activities_lead_id_idx" ON "activities"("lead_id");

-- CreateIndex
CREATE INDEX "activities_deal_id_idx" ON "activities"("deal_id");

-- CreateIndex
CREATE INDEX "activities_task_id_idx" ON "activities"("task_id");

-- CreateIndex
CREATE INDEX "activities_activity_type_idx" ON "activities"("activity_type");

-- CreateIndex
CREATE INDEX "activities_activity_date_idx" ON "activities"("activity_date");

-- CreateIndex
CREATE INDEX "activities_created_at_idx" ON "activities"("created_at");

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_lost_reason_id_fkey" FOREIGN KEY ("lost_reason_id") REFERENCES "lost_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
