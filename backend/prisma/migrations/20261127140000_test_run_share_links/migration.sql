-- CreateTable
CREATE TABLE IF NOT EXISTS "test_run_share_links" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testRunId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "test_run_share_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "test_run_share_links_tokenHash_key" ON "test_run_share_links"("tokenHash");
CREATE INDEX IF NOT EXISTS "test_run_share_links_testRunId_idx" ON "test_run_share_links"("testRunId");
CREATE INDEX IF NOT EXISTS "test_run_share_links_createdByUserId_idx" ON "test_run_share_links"("createdByUserId");

DO $$ BEGIN
  ALTER TABLE "test_run_share_links" ADD CONSTRAINT "test_run_share_links_testRunId_fkey"
    FOREIGN KEY ("testRunId") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "test_run_share_links" ADD CONSTRAINT "test_run_share_links_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
