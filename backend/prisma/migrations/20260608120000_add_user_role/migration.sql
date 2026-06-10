-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

-- Primary platform admin
UPDATE "users" SET "role" = 'ADMIN' WHERE LOWER("email") = LOWER('donkditren@gmail.com');
