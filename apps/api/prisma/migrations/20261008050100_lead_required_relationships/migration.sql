-- DropForeignKey
ALTER TABLE "customers" DROP CONSTRAINT "customers_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "deals" DROP CONSTRAINT "deals_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "meetings" DROP CONSTRAINT "meetings_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "proposals" DROP CONSTRAINT "proposals_lead_id_fkey";

-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "lead_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "deals" ALTER COLUMN "lead_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "meetings" ALTER COLUMN "lead_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "proposals" ALTER COLUMN "lead_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
