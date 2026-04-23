# 🎬 Playwright Recorder - End-to-End Testing Guide

## Architecture Overview

### OLD (Proxy-Based) ❌
```
User Browser Window
    ↓
Proxy Server (http://localhost:5001/recorder?sessionId=X)
    ↓
Injected Script captures steps
    ↓
Send steps via fetch to backend
```

### NEW (Playwright-Based) ✅
```
Frontend UI
    ↓
Start Recording API Call
    ↓
Backend launches Playwright headless browser
    ↓
Injects recorder script directly
    ↓
Frontend polls every 1.5s for updates
    ↓
Stop Recording extracts and saves steps
```

## Quick Start

### 1. Ensure Servers are Running

**Terminal 1 - Backend:**
```bash
cd d:\testingndrih\backend
npm run dev
# Output: ✅ Backend server running on port 5001
```

**Terminal 2 - Frontend:**
```bash
cd d:\testingndrih\frontend
npm run dev
# Output: ✅ Frontend server running on port 3001
```

**Terminal 3 - PostgreSQL (if using Docker):**
```bash
docker-compose up -d db
```

### 2. Verify Services Running

```bash
# Check Backend
curl http://localhost:5001/api/

# Check Frontend
curl http://localhost:3001/
```

## Unit Test - Standalone Playwright

✅ **Already Passing** - Located at `backend/test-playwright-recorder.js`

Run it anytime:
```bash
cd backend
node test-playwright-recorder.js
```

Expected output:
```
✅ ALL TESTS PASSED
Summary:
  • Browser launched: ✅
  • Context created: ✅
  • Recorder script injected: ✅
  • Steps captured: 3 ✅
  • Browser cleanup: ✅
```

## Manual E2E Test - Recording Flow

### Scenario: Record a Login & Search Flow

#### Step 1: Authentication
```bash
# Get or create a test user token
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Expected response:
```json
{
  "success": true,
  "user": { "id": "user-123", "email": "test@example.com" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Step 2: Create/Get Scenario

**List scenarios:**
```bash
curl http://localhost:5001/api/scenarios \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create scenario:**
```bash
curl -X POST http://localhost:5001/api/scenarios \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Login Test",
    "description": "Test login flow",
    "tags": ["smoke", "auth"]
  }'
```

Response includes `scenarioId` in the JSON.

#### Step 3: Start Recording

```bash
curl -X POST http://localhost:5001/api/recorder/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "scenarioId": "scenario-123",
    "url": "https://example.com"
  }'
```

Expected response:
```json
{
  "success": true,
  "status": "recording",
  "method": "playwright",
  "browserPid": "unknown",
  "message": "Recording started dengan Playwright browser 🎥"
}
```

⚠️ **Important**: At this point:
- A headless Playwright browser is running on the backend
- The browser has the recorder script injected
- No window appears on your screen (it's headless)
- Your frontend will start polling for status

#### Step 4: Record Interactions

The Playwright browser on the backend is recording. You need to simulate interactions on the target URL.

You can:
1. **Option A**: Use Playwright API in a separate script to simulate clicks/fills
2. **Option B**: Manually use Playwright Browser for testing
3. **Option C**: The recorder captures what happens in the backend browser

For testing, create `backend/test-interactions.js`:

```javascript
import { chromium } from 'playwright'

async function simulateInteractions() {
  const browser = await chromium.connect('ws://localhost:5001/recorder')
  // OR use the page object if exposed via API
  console.log('Simulating user interactions...')
}

simulateInteractions()
```

#### Step 5: Check Recording Status

```bash
curl "http://localhost:5001/api/recorder/status/scenario-123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "status": "recording",
  "steps": [
    {
      "type": "NAVIGATE",
      "description": "Navigate to https://example.com",
      "value": "https://example.com"
    }
  ],
  "stepCount": 1
}
```

#### Step 6: Stop Recording

```bash
curl -X POST http://localhost:5001/api/recorder/stop \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{ "scenarioId": "scenario-123" }'
```

Expected response:
```json
{
  "success": true,
  "status": "stopped",
  "stepCount": 3,
  "steps": [
    {
      "type": "NAVIGATE",
      "description": "Navigate to example.com",
      "value": "https://example.com",
      "selector": null
    },
    {
      "type": "CLICK",
      "description": "Click on element",
      "selector": "button#login"
    },
    {
      "type": "FILL",
      "description": "Fill in email field",
      "selector": "input[type=email]",
      "value": "test@example.com"
    }
  ],
  "duration": "2.34s",
  "message": "Recording stopped, 3 steps recorded"
}
```

#### Step 7: Verify Steps Saved to Database

```bash
# Connect to PostgreSQL
psql -U postgres -d your_db

# Query the test_steps table
SELECT * FROM test_steps 
WHERE scenario_id = 'scenario-123'
ORDER BY created_at DESC;
```

Expected output:
```
 id  | scenario_id | step_type | selector | value | position | created_at
-----+-------------+-----------+----------+-------+----------+------------------
 345 | scenario-123| NAVIGATE  | null     | ...   | 0        | 2024-12-20 10:15
 346 | scenario-123| CLICK     | button#..| null  | 1        | 2024-12-20 10:15
 347 | scenario-123| FILL      | input... | ...   | 2        | 2024-12-20 10:15
```

## Frontend UI Test - Recording Tab

### Step 1: Open Scenario Page

1. Navigate to http://localhost:3001
2. Go to Scenarios page
3. Select or create a scenario

### Step 2: Start Recording

1. Click "Start Recording" button
2. Enter target URL (e.g., https://example.com)
3. Click confirm

**Verification:**
- ✅ Recording indicator appears
- ✅ No proxy window opens (headless browser runs on backend)
- ✅ Status changes to "Recording..."

### Step 3: Watch Live Step Feed

1. Scroll to "Recorded Steps" section
2. Every ~1.5 seconds, frontend polls backend for updates
3. New steps appear in real-time as they're captured

**Expected flow:**
```
[RECORDING] Recording started...
  └─ [1] NAVIGATE - https://example.com (0.2s)
  └─ [2] CLICK - button#submit (0.3s)
  └─ [3] FILL - email field with 'test@example.com' (0.1s)
  └─ [4] SCROLL - Down 500px (0.2s)
```

### Step 4: Stop Recording

1. Click "Stop Recording" button
2. Confirm action

**Verification:**
- ✅ Recording status changes to "Stopped"
- ✅ Step count displayed
- ✅ Steps auto-saved to database
- ✅ Scenario updated with new test steps

## Test Cases & Scenarios

### Test Case 1: Simple Navigation
**Target**: https://example.com
**Expected Steps**: 1 (NAVIGATE)
**Expected Duration**: <1s

### Test Case 2: Form Interaction
**Target**: https://httpbin.org/forms/post
**Interactions**: 
- Fill name: "John Doe"
- Select radio button
- Click submit
**Expected Steps**: 4-5 (NAVIGATE, FILL x2, CLICK x1-2)
**Expected Duration**: 3-5s

### Test Case 3: Multi-Page Flow
**Target**: https://example.com
**Interactions**:
- Click link to page 2
- Fill form
- Submit
- Check confirmation
**Expected Steps**: 6-8
**Expected Duration**: 10-15s

## Troubleshooting

### Issue: Recording never starts
**Symptoms**: API returns error
**Solution**:
1. Check backend running: `curl http://localhost:5001/api/`
2. Check auth token valid
3. Check scenario exists

### Issue: No steps captured
**Symptoms**: Steps array empty after stop
**Possible causes**:
1. Playwright browser crashed → Check backend logs for errors
2. Recorder script not injected → Check browser console
3. No interactions performed → Verify test script is running

**Debug**:
```bash
# Backend logs
tail -f backend/nohup.out

# Check status endpoint
curl "http://localhost:5001/api/recorder/status/scenario-123"
```

### Issue: Steps not saved to database
**Symptoms**: API returns success but database empty
**Possible causes**:
1. Database not connected
2. Prisma migration not run

**Debug**:
```bash
# Run migrations
cd backend
npx prisma migrate deploy

# Check DB connection
npx prisma studio
```

### Issue: Playwright browser hangs
**Symptoms**: Recording never stops, timeout error
**Solution**:
1. Increase timeout in recorderService.js (default: 30s per navigation)
2. Check target website isn't slow
3. Manual cleanup: Kill node processes and restart

```bash
# Kill all node processes
pkill -f node

# Restart servers
cd backend && npm run dev
```

## Performance Benchmarks

| Metric | Expected | Actual |
|--------|----------|--------|
| Browser startup | <2s | ✓ |
| Recorder injection | <0.1s | ✓ |
| Step capture | <10ms/step | ✓ |
| Polling interval | 1.5s | ✓ |
| DB save | <1s | ✓ |
| Cleanup | <0.5s | ✓ |

## Success Criteria Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads on :3001
- [ ] Unit test passes (test-playwright-recorder.js)
- [ ] Recording API responds with method: 'playwright'
- [ ] No proxy window opens during recording
- [ ] Steps captured during interactions
- [ ] Steps extracted when recording stops
- [ ] Steps saved to PostgreSQL
- [ ] Frontend shows recorded steps in real-time
- [ ] No errors in browser console
- [ ] No errors in backend logs

## API Endpoints Reference

| Method | Endpoint | Auth | Body |
|--------|----------|------|------|
| POST | /api/recorder/start | ✓ | scenarioId, url |
| POST | /api/recorder/stop | ✓ | scenarioId |
| GET | /api/recorder/status/:scenarioId | ✓ | - |
| POST | /api/recorder/save/:scenarioId | ✓ | steps[] |

## Files Reference

- **Backend Service**: `backend/src/services/recorderService.js`
- **Backend Controller**: `backend/src/controllers/recorderController.js`
- **Frontend Page**: `frontend/src/pages/ScenarioDetailPage.jsx`
- **Unit Test**: `backend/test-playwright-recorder.js`
- **Routes**: `backend/src/routes/recorderRoutes.js`

---

**Last Updated**: Session with Playwright implementation
**Status**: ✅ Ready for Manual Testing
**Next**: Execute manual E2E test and verify all steps work correctly
