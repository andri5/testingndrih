-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "StepType" AS ENUM ('NAVIGATE', 'CLICK', 'FILL', 'SCREENSHOT', 'WAIT', 'ASSERTION', 'API_CALL');

-- CreateEnum
CREATE TYPE "ApiMethod" AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'CLOSED', 'IN_PROGRESS');

-- CreateEnum
CREATE TYPE "IssueSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenarios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "steps" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_steps" (
    "id" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "type" "StepType" NOT NULL,
    "description" TEXT NOT NULL,
    "selector" TEXT,
    "value" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "test_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executions" (
    "id" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "errorMessage" TEXT,
    "passedSteps" INTEGER NOT NULL DEFAULT 0,
    "failedSteps" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "step_results" (
    "id" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL,
    "errorMessage" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "executionId" TEXT NOT NULL,
    "testStepId" TEXT NOT NULL,

    CONSTRAINT "step_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screenshots" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executionId" TEXT NOT NULL,
    "stepResultId" TEXT NOT NULL,

    CONSTRAINT "screenshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_tests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "method" "ApiMethod" NOT NULL,
    "url" TEXT NOT NULL,
    "headers" TEXT,
    "body" TEXT,
    "expectedCode" INTEGER NOT NULL DEFAULT 200,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scenarioId" TEXT NOT NULL,

    CONSTRAINT "api_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_test_results" (
    "id" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "response" TEXT,
    "passed" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "apiTestId" TEXT NOT NULL,

    CONSTRAINT "api_test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "IssueSeverity" NOT NULL DEFAULT 'MEDIUM',
    "stepNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "executionId" TEXT NOT NULL,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_logs" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "scenarios_userId_idx" ON "scenarios"("userId");

-- CreateIndex
CREATE INDEX "test_steps_scenarioId_idx" ON "test_steps"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "test_steps_scenarioId_stepNumber_key" ON "test_steps"("scenarioId", "stepNumber");

-- CreateIndex
CREATE INDEX "executions_userId_idx" ON "executions"("userId");

-- CreateIndex
CREATE INDEX "executions_scenarioId_idx" ON "executions"("scenarioId");

-- CreateIndex
CREATE INDEX "executions_status_idx" ON "executions"("status");

-- CreateIndex
CREATE INDEX "step_results_executionId_idx" ON "step_results"("executionId");

-- CreateIndex
CREATE INDEX "step_results_testStepId_idx" ON "step_results"("testStepId");

-- CreateIndex
CREATE UNIQUE INDEX "screenshots_stepResultId_key" ON "screenshots"("stepResultId");

-- CreateIndex
CREATE INDEX "screenshots_executionId_idx" ON "screenshots"("executionId");

-- CreateIndex
CREATE INDEX "api_tests_scenarioId_idx" ON "api_tests"("scenarioId");

-- CreateIndex
CREATE INDEX "api_test_results_apiTestId_idx" ON "api_test_results"("apiTestId");

-- CreateIndex
CREATE INDEX "issues_executionId_idx" ON "issues"("executionId");

-- CreateIndex
CREATE INDEX "execution_logs_executionId_idx" ON "execution_logs"("executionId");

-- CreateIndex
CREATE INDEX "execution_logs_userId_idx" ON "execution_logs"("userId");

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_steps" ADD CONSTRAINT "test_steps_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executions" ADD CONSTRAINT "executions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executions" ADD CONSTRAINT "executions_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "step_results" ADD CONSTRAINT "step_results_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "step_results" ADD CONSTRAINT "step_results_testStepId_fkey" FOREIGN KEY ("testStepId") REFERENCES "test_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screenshots" ADD CONSTRAINT "screenshots_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screenshots" ADD CONSTRAINT "screenshots_stepResultId_fkey" FOREIGN KEY ("stepResultId") REFERENCES "step_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_tests" ADD CONSTRAINT "api_tests_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_test_results" ADD CONSTRAINT "api_test_results_apiTestId_fkey" FOREIGN KEY ("apiTestId") REFERENCES "api_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
