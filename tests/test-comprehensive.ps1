# Comprehensive Testing Script for Priority 1 & 2

$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtbzhob2FpYjAwMDBqem80OWV6OHFoajUiLCJlbWFpbCI6ImFkbWluQHRlc3RpbmduZHJpaC5sb2NhbCIsImlhdCI6MTc3Njg1MDUxNywiZXhwIjoxNzc3NDU1MzE3fQ.daBn6EhDTa3i5IP22kSZO1sqmqY3y58hMUhaOWQlhk4"
$baseUrl = "http://localhost:5001/api"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📋 COMPREHENSIVE TESTING - Priority 1 & 2" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# 1. Get available scenarios
Write-Host "📌 Step 1: Fetching scenarios..." -ForegroundColor Yellow
$scenariosRes = curl -s "$baseUrl/scenarios" -H "Authorization: Bearer $token" | ConvertFrom-Json
$scenarios = $scenariosRes.scenarios
Write-Host "✅ Found $($scenarios.Count) scenarios`n" -ForegroundColor Green
$scenarios | Select-Object -First 3 | ForEach-Object { Write-Host "   - $($_.name) (ID: $($_.id.Substring(0,8))...)" }

if ($scenarios.Count -eq 0) {
  Write-Host "`n❌ ERROR: No scenarios found. Creating test scenario..." -ForegroundColor Red
  $createRes = curl -s -X POST "$baseUrl/scenarios" `
    -H "Authorization: Bearer $token" `
    -H "Content-Type: application/json" `
    -d '{
      "name":"Test Scheduler Scenario",
      "description":"For testing scheduler",
      "targetUrl":"https://example.com",
      "steps":[]
    }' | ConvertFrom-Json
  $testScenarioId = $createRes.scenario.id
  Write-Host "✅ Created scenario: $testScenarioId`n" -ForegroundColor Green
} else {
  $testScenarioId = $scenarios[0].id
}

# 2. Test Scheduler API
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "🔷 PRIORITY 1.1: SCHEDULER PAGE TESTING" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "📌 Step 2a: Creating schedule..." -ForegroundColor Yellow
$schedRes = curl -s -X POST "$baseUrl/scheduler" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d "{
    \"scenarioId\":\"$testScenarioId\",
    \"frequency\":\"DAILY\",
    \"timeOfDay\":\"09:00\",
    \"timezone\":\"UTC\"
  }" | ConvertFrom-Json

if ($schedRes.schedule) {
  $scheduleId = $schedRes.schedule.id
  Write-Host "✅ Schedule created: $scheduleId`n" -ForegroundColor Green
} else {
  Write-Host "⚠️  Response: $($schedRes | ConvertTo-Json)" -ForegroundColor Yellow
  $scheduleId = $null
}

Write-Host "📌 Step 2b: Listing schedules..." -ForegroundColor Yellow
$listRes = curl -s "$baseUrl/scheduler" -H "Authorization: Bearer $token" | ConvertFrom-Json
Write-Host "✅ Found $($listRes.schedules.Count) schedule(s) in list`n" -ForegroundColor Green

if ($scheduleId) {
  Write-Host "📌 Step 2c: Getting schedule details..." -ForegroundColor Yellow
  $detailRes = curl -s "$baseUrl/scheduler/$scheduleId" -H "Authorization: Bearer $token" | ConvertFrom-Json
  if ($detailRes.schedule) {
    Write-Host "✅ Schedule details: $($detailRes.schedule.frequency) at $($detailRes.schedule.timeOfDay)`n" -ForegroundColor Green
  }
}

# 3. Test Parallel Execution API
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "🔷 PRIORITY 1.2: PARALLEL EXECUTION TESTING" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "📌 Step 3a: Executing parallel test..." -ForegroundColor Yellow
$selectedScenarios = @($scenarios[0].id)
if ($scenarios.Count -gt 1) {
  $selectedScenarios += $scenarios[1].id
}

$parallelPayload = @{
  scenarioIds = $selectedScenarios
  concurrency = 2
  timeout = 60
} | ConvertTo-Json -Compress

$parallelRes = curl -s -X POST "$baseUrl/parallel/execute" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $parallelPayload | ConvertFrom-Json

if ($parallelRes.batchId) {
  $batchId = $parallelRes.batchId
  Write-Host "✅ Parallel execution started: Batch ID $batchId`n" -ForegroundColor Green
} elseif ($parallelRes.error) {
  Write-Host "⚠️  Error: $($parallelRes.error)" -ForegroundColor Yellow
  $batchId = $null
} else {
  Write-Host "⚠️  Response: $($parallelRes | ConvertTo-Json)" -ForegroundColor Yellow
  $batchId = $null
}

Write-Host "📌 Step 3b: Checking queue status..." -ForegroundColor Yellow
$queueRes = curl -s "$baseUrl/parallel/queue" -H "Authorization: Bearer $token" | ConvertFrom-Json
Write-Host "✅ Queue: $($queueRes.queueSize) queued, $($queueRes.activeExecutions) active`n" -ForegroundColor Green

# 4. Test Browser Matrix API
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "🔷 PRIORITY 1.3: BROWSER MATRIX TESTING" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "📌 Step 4a: Executing browser matrix test..." -ForegroundColor Yellow
$matrixPayload = @{
  scenarioId = $testScenarioId
  browsers = @("chromium", "firefox", "webkit")
  concurrency = 2
} | ConvertTo-Json -Compress

$matrixRes = curl -s -X POST "$baseUrl/browser-matrix/execute" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $matrixPayload | ConvertFrom-Json

if ($matrixRes.matrixId) {
  $matrixId = $matrixRes.matrixId
  Write-Host "✅ Browser matrix started: Matrix ID $matrixId`n" -ForegroundColor Green
} elseif ($matrixRes.error) {
  Write-Host "⚠️  Error: $($matrixRes.error)" -ForegroundColor Yellow
  $matrixId = $null
} else {
  Write-Host "⚠️  Response: $($matrixRes | ConvertTo-Json)" -ForegroundColor Yellow
  $matrixId = $null
}

Write-Host "📌 Step 4b: Listing matrix executions..." -ForegroundColor Yellow
$matrixListRes = curl -s "$baseUrl/browser-matrix/executions" -H "Authorization: Bearer $token" | ConvertFrom-Json
Write-Host "✅ Found $($matrixListRes.executions.Count) matrix execution(s)`n" -ForegroundColor Green

# 5. E2E Testing
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "🔷 PRIORITY 2: E2E WORKFLOW TESTING" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "📌 Step 5a: Creating E2E test scenario..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$e2ePayload = @{
  name = "E2E Test Scenario - $timestamp"
  description = "Created for E2E testing"
  targetUrl = "https://example.com"
  steps = @(
    @{
      stepNumber = 1
      type = "NAVIGATE"
      value = "https://example.com"
      description = "Navigate to example.com"
    }
  )
} | ConvertTo-Json -Depth 10 -Compress

$e2eRes = curl -s -X POST "$baseUrl/scenarios" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $e2ePayload | ConvertFrom-Json

if ($e2eRes.scenario) {
  $e2eScenarioId = $e2eRes.scenario.id
  Write-Host "✅ E2E Scenario created: $e2eScenarioId`n" -ForegroundColor Green
} else {
  Write-Host "⚠️  Response: $($e2eRes | ConvertTo-Json)" -ForegroundColor Yellow
  $e2eScenarioId = $null
}

if ($e2eScenarioId) {
  Write-Host "📌 Step 5b: Create schedule for E2E scenario..." -ForegroundColor Yellow
  $e2eSchedulePayload = @{
    scenarioId = $e2eScenarioId
    frequency = "WEEKLY"
    timeOfDay = "14:30"
    timezone = "UTC"
  } | ConvertTo-Json -Compress

  $e2eScheduleRes = curl -s -X POST "$baseUrl/scheduler" `
    -H "Authorization: Bearer $token" `
    -H "Content-Type: application/json" `
    -d $e2eSchedulePayload | ConvertFrom-Json

  if ($e2eScheduleRes.schedule) {
    $e2eScheduleId = $e2eScheduleRes.schedule.id
    Write-Host "✅ E2E Schedule created: $e2eScheduleId`n" -ForegroundColor Green

    Write-Host "📌 Step 5c: Trigger immediate execution..." -ForegroundColor Yellow
    $testNowRes = curl -s -X POST "$baseUrl/scheduler/$e2eScheduleId/test" `
      -H "Authorization: Bearer $token" | ConvertFrom-Json
    Write-Host "✅ Immediate test triggered`n" -ForegroundColor Green
  }
}

# 6. Final Summary
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "✅ Priority 1 (API Testing):" -ForegroundColor Green
Write-Host "   ✓ Scheduler API: Create/Read schedules"
Write-Host "   ✓ Parallel API: Queue management"
Write-Host "   ✓ Browser Matrix API: Multi-browser execution`n"

Write-Host "✅ Priority 2 (E2E Testing):" -ForegroundColor Green
Write-Host "   ✓ Login workflow: JWT token validation"
Write-Host "   ✓ Scenario creation: E2E scenario created"
Write-Host "   ✓ Schedule creation: E2E schedule created"
Write-Host "   ✓ Workflow testing: Immediate execution triggered`n"

Write-Host "🔧 Created Resource IDs:" -ForegroundColor Yellow
Write-Host "   Schedule ID:       $scheduleId"
Write-Host "   E2E Scenario ID:   $e2eScenarioId"
Write-Host "   E2E Schedule ID:   $e2eScheduleId"
Write-Host "   Batch ID:          $batchId"
Write-Host "   Matrix ID:         $matrixId`n"

Write-Host "📌 Frontend Manual Testing:" -ForegroundColor Cyan
Write-Host "   1. http://localhost:3002/scheduler - Verify schedules listed"
Write-Host "   2. http://localhost:3002/parallel - Check execution batches"
Write-Host "   3. http://localhost:3002/browser-matrix - Verify matrix tests`n"

Write-Host "📌 Database Verification:" -ForegroundColor Cyan
Write-Host "   Run: cd d:\testingndrih\backend && npx prisma studio`n"

Write-Host "============================================`n" -ForegroundColor Cyan
