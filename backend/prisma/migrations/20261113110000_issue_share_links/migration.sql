-- CreateTable
CREATE TABLE IF NOT EXISTS "issue_share_links" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issueId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "issue_share_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "issue_share_links_tokenHash_key" ON "issue_share_links"("tokenHash");
CREATE INDEX IF NOT EXISTS "issue_share_links_issueId_idx" ON "issue_share_links"("issueId");
CREATE INDEX IF NOT EXISTS "issue_share_links_createdByUserId_idx" ON "issue_share_links"("createdByUserId");

DO $$ BEGIN
  ALTER TABLE "issue_share_links" ADD CONSTRAINT "issue_share_links_issueId_fkey"
    FOREIGN KEY ("issueId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "issue_share_links" ADD CONSTRAINT "issue_share_links_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;