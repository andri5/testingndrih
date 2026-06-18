-- AlterTable
ALTER TABLE "users" ADD COLUMN "menuPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "landing_feedback" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "page" TEXT,
    "lang" TEXT DEFAULT 'id',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landing_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_page_views" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "lang" TEXT,
    "visitorId" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_page_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "landing_feedback_createdAt_idx" ON "landing_feedback"("createdAt");

-- CreateIndex
CREATE INDEX "site_page_views_path_idx" ON "site_page_views"("path");

-- CreateIndex
CREATE INDEX "site_page_views_createdAt_idx" ON "site_page_views"("createdAt");

-- CreateIndex
CREATE INDEX "site_page_views_visitorId_idx" ON "site_page_views"("visitorId");
