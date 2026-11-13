CREATE TABLE IF NOT EXISTS "issue_attachments" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issueId" TEXT NOT NULL,
    "uploadedById" TEXT,

    CONSTRAINT "issue_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "issue_attachments_issueId_idx" ON "issue_attachments"("issueId");

DO $$ BEGIN
  ALTER TABLE "issue_attachments" ADD CONSTRAINT "issue_attachments_issueId_fkey"
    FOREIGN KEY ("issueId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;