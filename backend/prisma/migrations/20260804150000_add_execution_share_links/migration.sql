-- P3: shareable run links
CREATE TABLE "execution_share_links" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executionId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "execution_share_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "execution_share_links_tokenHash_key" ON "execution_share_links"("tokenHash");
CREATE INDEX "execution_share_links_executionId_idx" ON "execution_share_links"("executionId");
CREATE INDEX "execution_share_links_createdByUserId_idx" ON "execution_share_links"("createdByUserId");

ALTER TABLE "execution_share_links" ADD CONSTRAINT "execution_share_links_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "execution_share_links" ADD CONSTRAINT "execution_share_links_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
