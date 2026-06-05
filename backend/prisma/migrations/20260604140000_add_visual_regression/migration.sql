-- CreateTable
CREATE TABLE "visual_baselines" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "browser" TEXT NOT NULL DEFAULT 'chromium',
    "imagePath" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visual_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visual_comparisons" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "executionId" TEXT,
    "stepNumber" INTEGER NOT NULL,
    "browser" TEXT NOT NULL DEFAULT 'chromium',
    "baselinePath" TEXT NOT NULL,
    "currentPath" TEXT NOT NULL,
    "diffPath" TEXT,
    "diffPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "diffPixels" INTEGER NOT NULL DEFAULT 0,
    "totalPixels" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'FAILED',
    "threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visual_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visual_baselines_userId_idx" ON "visual_baselines"("userId");

-- CreateIndex
CREATE INDEX "visual_baselines_scenarioId_idx" ON "visual_baselines"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "visual_baselines_scenarioId_stepNumber_browser_key" ON "visual_baselines"("scenarioId", "stepNumber", "browser");

-- CreateIndex
CREATE INDEX "visual_comparisons_userId_idx" ON "visual_comparisons"("userId");

-- CreateIndex
CREATE INDEX "visual_comparisons_scenarioId_idx" ON "visual_comparisons"("scenarioId");

-- CreateIndex
CREATE INDEX "visual_comparisons_executionId_idx" ON "visual_comparisons"("executionId");

-- CreateIndex
CREATE INDEX "visual_comparisons_status_idx" ON "visual_comparisons"("status");

-- AddForeignKey
ALTER TABLE "visual_baselines" ADD CONSTRAINT "visual_baselines_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visual_baselines" ADD CONSTRAINT "visual_baselines_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visual_comparisons" ADD CONSTRAINT "visual_comparisons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visual_comparisons" ADD CONSTRAINT "visual_comparisons_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
