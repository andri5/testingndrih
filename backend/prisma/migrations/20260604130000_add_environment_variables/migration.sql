-- CreateTable
CREATE TABLE "test_environments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baseUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_environments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environment_variables" (
    "id" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "environment_variables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "test_environments_userId_idx" ON "test_environments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "test_environments_userId_name_key" ON "test_environments"("userId", "name");

-- CreateIndex
CREATE INDEX "environment_variables_environmentId_idx" ON "environment_variables"("environmentId");

-- CreateIndex
CREATE UNIQUE INDEX "environment_variables_environmentId_key_key" ON "environment_variables"("environmentId", "key");

-- AddForeignKey
ALTER TABLE "test_environments" ADD CONSTRAINT "test_environments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environment_variables" ADD CONSTRAINT "environment_variables_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "test_environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
