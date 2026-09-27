-- AlterTable
ALTER TABLE "users" ADD COLUMN     "notify_budget_alerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notify_saving_tips" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notify_weekly_summary" BOOLEAN NOT NULL DEFAULT true;
