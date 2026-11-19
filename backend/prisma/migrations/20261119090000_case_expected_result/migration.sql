-- Case-level expected result (text) + attachment kind for expected-result images

ALTER TABLE "scenarios" ADD COLUMN IF NOT EXISTS "expectedResult" TEXT;

ALTER TABLE "scenario_attachments" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'GENERAL';

CREATE INDEX IF NOT EXISTS "scenario_attachments_scenarioId_kind_idx"
  ON "scenario_attachments"("scenarioId", "kind");
