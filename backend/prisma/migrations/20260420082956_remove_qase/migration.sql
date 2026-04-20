/*
  Warnings:

  - You are about to drop the `qase_integrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `qase_test_cases` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "qase_integrations" DROP CONSTRAINT "qase_integrations_userId_fkey";

-- DropForeignKey
ALTER TABLE "qase_test_cases" DROP CONSTRAINT "qase_test_cases_scenarioId_fkey";

-- DropForeignKey
ALTER TABLE "qase_test_cases" DROP CONSTRAINT "qase_test_cases_userId_fkey";

-- DropTable
DROP TABLE "qase_integrations";

-- DropTable
DROP TABLE "qase_test_cases";
