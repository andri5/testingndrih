-- CreateTable
CREATE TABLE "qase_integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "projectCode" TEXT NOT NULL,
    "isConnected" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qase_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qase_test_cases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "qaseId" INTEGER NOT NULL,
    "caseTitle" TEXT NOT NULL,
    "caseDescription" TEXT,
    "qaseStatus" TEXT NOT NULL,
    "scenarioId" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qase_test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "qase_integrations_userId_key" ON "qase_integrations"("userId");

-- CreateIndex
CREATE INDEX "qase_integrations_userId_idx" ON "qase_integrations"("userId");

-- CreateIndex
CREATE INDEX "qase_test_cases_userId_idx" ON "qase_test_cases"("userId");

-- CreateIndex
CREATE INDEX "qase_test_cases_scenarioId_idx" ON "qase_test_cases"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "qase_test_cases_qaseId_userId_key" ON "qase_test_cases"("qaseId", "userId");

-- AddForeignKey
ALTER TABLE "qase_integrations" ADD CONSTRAINT "qase_integrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qase_test_cases" ADD CONSTRAINT "qase_test_cases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "qase_integrations"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qase_test_cases" ADD CONSTRAINT "qase_test_cases_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
