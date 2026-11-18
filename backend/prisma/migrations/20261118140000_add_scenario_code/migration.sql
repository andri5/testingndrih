-- AlterTable
ALTER TABLE "scenarios" ADD COLUMN IF NOT EXISTS "scenarioCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "scenarios_scenarioCode_key" ON "scenarios"("scenarioCode");
