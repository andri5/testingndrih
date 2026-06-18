-- AlterTable
ALTER TABLE "scenarios" ADD COLUMN "isFavorite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "scenarios" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
