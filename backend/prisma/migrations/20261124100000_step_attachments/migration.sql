-- AlterTable
ALTER TABLE "scenario_attachments" ADD COLUMN "testStepId" TEXT;

-- CreateIndex
CREATE INDEX "scenario_attachments_testStepId_idx" ON "scenario_attachments"("testStepId");

-- AddForeignKey
ALTER TABLE "scenario_attachments" ADD CONSTRAINT "scenario_attachments_testStepId_fkey" FOREIGN KEY ("testStepId") REFERENCES "test_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
