-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StepType" ADD VALUE 'HOVER';
ALTER TYPE "StepType" ADD VALUE 'SCROLL';
ALTER TYPE "StepType" ADD VALUE 'FILE_UPLOAD';

-- AlterTable
ALTER TABLE "executions" ADD COLUMN     "browser" TEXT DEFAULT 'chromium',
ADD COLUMN     "headless" BOOLEAN DEFAULT false,
ADD COLUMN     "videoPath" TEXT;
