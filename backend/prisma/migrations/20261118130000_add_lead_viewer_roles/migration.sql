-- AlterEnum: add LEAD and VIEWER (idempotent-ish for re-runs)
DO $$ BEGIN
  ALTER TYPE "UserRole" ADD VALUE 'LEAD';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "UserRole" ADD VALUE 'VIEWER';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
