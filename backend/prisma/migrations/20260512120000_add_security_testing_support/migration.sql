-- AlterTable scenarios
ALTER TABLE "scenarios" ADD COLUMN "isSecurity" BOOLEAN DEFAULT false;

-- Add index for new column
CREATE INDEX "scenarios_isSecurity_idx" ON "scenarios"("isSecurity");

-- CreateTable SecurityScan
CREATE TABLE "security_scans" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "executionId" TEXT,
    "scanType" VARCHAR(50) NOT NULL DEFAULT 'full',
    "vulnTypesTargeted" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "findingsCount" INTEGER NOT NULL DEFAULT 0,
    "criticalCount" INTEGER NOT NULL DEFAULT 0,
    "highCount" INTEGER NOT NULL DEFAULT 0,
    "mediumCount" INTEGER NOT NULL DEFAULT 0,
    "lowCount" INTEGER NOT NULL DEFAULT 0,
    "infoCount" INTEGER NOT NULL DEFAULT 0,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "security_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable SecurityFinding
CREATE TABLE "security_findings" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(50) NOT NULL,
    "cvssScore" DOUBLE PRECISION NOT NULL,
    "cvssVector" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affectedUrl" TEXT,
    "affectedParameter" TEXT,
    "payload" TEXT,
    "evidenceRequest" TEXT,
    "evidenceResponse" TEXT,
    "remediationNotes" TEXT,
    "owasp10Category" VARCHAR(50),
    "cveId" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'NEW',
    "confirmedAt" TIMESTAMP(3),
    "fixedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable SecurityPayload
CREATE TABLE "security_payloads" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(50) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payloadContent" TEXT NOT NULL,
    "targetParameter" VARCHAR(50) NOT NULL,
    "detectionPattern" TEXT,
    "expectedIndicators" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isDangerous" BOOLEAN NOT NULL DEFAULT false,
    "category" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_payloads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "security_scans_userId_idx" ON "security_scans"("userId");
CREATE INDEX "security_scans_scenarioId_idx" ON "security_scans"("scenarioId");
CREATE INDEX "security_scans_status_idx" ON "security_scans"("status");
CREATE INDEX "security_scans_riskScore_idx" ON "security_scans"("riskScore");

-- CreateIndex
CREATE INDEX "security_findings_scanId_idx" ON "security_findings"("scanId");
CREATE INDEX "security_findings_severity_idx" ON "security_findings"("severity");
CREATE INDEX "security_findings_type_idx" ON "security_findings"("type");
CREATE INDEX "security_findings_cvssScore_idx" ON "security_findings"("cvssScore");

-- CreateIndex
CREATE INDEX "security_payloads_type_idx" ON "security_payloads"("type");
CREATE INDEX "security_payloads_category_idx" ON "security_payloads"("category");

-- AddForeignKey
ALTER TABLE "security_scans" ADD CONSTRAINT "security_scans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "security_scans" ADD CONSTRAINT "security_scans_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_findings" ADD CONSTRAINT "security_findings_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "security_scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
