-- CreateTable
CREATE TABLE "scenario_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "userId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenario_folders_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "scenarios" ADD COLUMN "folderId" TEXT;
ALTER TABLE "scenarios" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "scenario_folders_userId_parentId_idx" ON "scenario_folders"("userId", "parentId");
CREATE INDEX "scenario_folders_userId_sortOrder_idx" ON "scenario_folders"("userId", "sortOrder");
CREATE INDEX "scenarios_userId_folderId_idx" ON "scenarios"("userId", "folderId");
CREATE INDEX "scenarios_folderId_sortOrder_idx" ON "scenarios"("folderId", "sortOrder");

-- AddForeignKey
ALTER TABLE "scenario_folders" ADD CONSTRAINT "scenario_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "scenario_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scenario_folders" ADD CONSTRAINT "scenario_folders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "scenario_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
