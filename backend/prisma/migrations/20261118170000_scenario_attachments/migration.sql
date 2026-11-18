-- Test case attachments (Testiny Attachments tab)
CREATE TABLE IF NOT EXISTS "scenario_attachments" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scenarioId" TEXT NOT NULL,
    "uploadedById" TEXT,

    CONSTRAINT "scenario_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "scenario_attachments_scenarioId_idx" ON "scenario_attachments"("scenarioId");

ALTER TABLE "scenario_attachments"
  DROP CONSTRAINT IF EXISTS "scenario_attachments_scenarioId_fkey";

ALTER TABLE "scenario_attachments"
  ADD CONSTRAINT "scenario_attachments_scenarioId_fkey"
  FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
