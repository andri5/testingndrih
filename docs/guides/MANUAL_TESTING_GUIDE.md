# 🎬 MANUAL TESTING GUIDE - PLAYWRIGHT RECORDER v2.0

**Date**: April 22, 2026  
**Status**: Ready for Testing  
**Test Environment**: Development (localhost)

---

## 📋 Pre-Testing Checklist

- [x] Backend running on `http://localhost:5001` ✅
- [ ] Frontend running on `http://localhost:3001`
- [ ] PostgreSQL database connected
- [ ] Playwright browser ready
- [ ] Test scenario created
- [ ] Recording URL prepared

---

## 🚀 Step 1: Start Frontend Server

Open **new terminal** and run:

```bash
cd d:\testingndrih\frontend
npm run dev
```

**Expected Output:**
```
  VITE v5.4.21  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

> If using different port (e.g., 5173), note it down. We'll use it to access the app.

---

## 🔑 Step 2: Login to Application

1. Navigate to **http://localhost:3001** (or the port from frontend)
2. **Create account** or **login** with test credentials
   - Email: `test@example.com`
   - Password: `Test123456`

3. You should see the **Dashboard** with list of scenarios

---

## 📌 Step 3: Create Test Scenario

1. Click **"New Scenario"** button
2. Fill in form:
   - **Name**: `Playwright Recording Test`
   - **Description**: `Testing Playwright recorder with manual interactions`
   - **URL**: `https://example.com` (or any target website)
3. Click **Create**
4. Note the **Scenario ID** (you'll need it)

---

## 🎥 Step 4: Start Recording

### In UI:
1. Click on the scenario you just created
2. Click **"Start Recording"** button
3. **Verify**:
   - ✅ No proxy window opens (different from v1.1)
   - ✅ Recording indicator shows on page
   - ✅ Status says "Recording..."
   - ✅ No errors in browser console
   - ✅ Method shows: **"playwright"** (not proxy)

### In API Response:
The start recording response should look like:
```json
{
  "success": true,
  "status": "recording",
  "method": "playwright",
  "message": "Recording started dengan Playwright browser 🎥"
}
```

---

## 🎭 Step 5: Perform Test Interactions

Now interact with the website. The recorder captures:

- **NAVIGATE** - Page navigation
- **CLICK** - Button/link clicks
- **FILL** - Form input
- **SELECT** - Dropdown selection
- **HOVER** - Mouse hover

### Example Interactions:
```javascript
// The recorder will capture:
1. FILL: input#email with "test@gmail.com"
2. CLICK: button#submit
3. WAIT: 2000 ms
4. NAVIGATE: https://dashboard.example.com
```

**During recording**:
- Watch the frontend - it should show real-time step count
- Steps should appear every 1.5 seconds in the UI
- Browser console should show no errors

---

## ⏹️ Step 6: Stop Recording

1. Click **"Stop Recording"** button
2. **Verify**:
   - ✅ Recording stopped
   - ✅ All captured steps display in the UI
   - ✅ Step count matches what you did
   - ✅ Each step has correct type, selector, description
   - ✅ Steps are auto-saved to database

### Expected Output:
```
Recording stopped ✅
Total steps captured: 4
Duration: 45 seconds

Steps:
1. NAVIGATE: https://example.com
2. FILL: #email = "test@example.com"
3. CLICK: button#submit
4. WAIT: 2 seconds
```

---

## 🔍 Step 7: Verify Results

### In Frontend:
- [ ] Steps appear in "Recorded Steps" list
- [ ] Step count matches interactions
- [ ] Each step has correct details
- [ ] No duplicate steps
- [ ] Timeline shows step sequence

### In Backend Logs:
Look for messages like:
```
[RECORDER] Recording started: scenario-123
[RECORDER] Step captured: FILL
[RECORDER] Step captured: CLICK
[RECORDER] Recording stopped: 4 steps
```

### In Database:
```bash
# Check if steps were saved
curl -X GET http://localhost:5001/api/scenarios/scenario-123 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return scenario with saved steps
```

---

## 📊 Test Scenarios to Try

### Scenario 1: Simple Form (Recommended)
**Target**: `https://example.com`
**Actions**:
1. Fill email field
2. Fill password field
3. Click submit
4. Wait for page load

**Expected**: 4-5 steps captured

### Scenario 2: Navigation Test
**Target**: `https://en.wikipedia.org`
**Actions**:
1. Click search box
2. Type search term
3. Press Enter
4. Click on result
5. Scroll down

**Expected**: 5-6 steps captured

### Scenario 3: Complex Form (Advanced)
**Target**: `https://example.com/form`
**Actions**:
1. Fill multiple fields
2. Select from dropdown
3. Check checkbox
4. Click submit
5. Verify redirect

**Expected**: 6-8 steps captured

---

## ✅ Success Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| Backend starts | ✅ | No port conflicts |
| Frontend loads | ⏳ | Should be next |
| Login works | ⏳ | Use test credentials |
| Recording starts | ⏳ | Method should be 'playwright' |
| Steps captured | ⏳ | Real-time in UI |
| Recording stops | ⏳ | All steps returned |
| Steps saved | ⏳ | In database |
| No errors | ⏳ | Console clean |

---

## 🐛 Debugging During Testing

### If Recording Won't Start
```bash
# Check backend logs
Check terminal for: "Recording started"

# Check browser console (F12)
Should see: "Recording initialized"

# Verify token
Check authorization header in Network tab
```

### If Steps Not Captured
```bash
# Check if page is accessible
curl http://localhost:5001/health

# Check recorder status
curl http://localhost:5001/api/recorder/status/SCENARIO_ID

# Check browser process
ps aux | grep chromium
```

### If Steps Not Saving
```bash
# Check database connection
Look for "Database connected" in logs

# Check API response
Should return steps in JSON array

# Verify scenario ID
Must match between frontend and backend
```

### Common Errors & Solutions

| Error | Solution |
|-------|----------|
| "Port 5001 in use" | Kill: `Get-Process -Id (Get-NetTCPConnection -LocalPort 5001).OwningProcess \| Stop-Process -Force` |
| "Cannot connect to DB" | Ensure PostgreSQL running, check `.env` DATABASE_URL |
| "browser.process error" | Ensure Playwright 1.40+ installed: `npm list playwright` |
| "No steps captured" | Check if interactions happened on recorded page, not UI |
| "Timeout error" | Increase timeout in recorderService.js, reduce to 60000ms |

---

## 📈 Performance Expectations

During testing, expect:

| Metric | Expected | Actual |
|--------|----------|--------|
| Backend startup | <5s | ___ |
| Frontend startup | <3s | ___ |
| Recording start | <2s | ___ |
| Step capture | <100ms | ___ |
| Polling interval | 1.5s | ___ |
| Recording stop | <2s | ___ |
| Memory usage | <300MB | ___ |

---

## 📸 Screenshots to Take

For documentation, capture:

1. **Login screen** - Show successful authentication
2. **Dashboard** - Show scenario created
3. **Recording started** - Show "Recording..." status
4. **During recording** - Show steps appearing in real-time
5. **Recording stopped** - Show all captured steps
6. **Step details** - Show individual step information

---

## 📝 Test Report Template

After testing, fill this in:

```markdown
# Manual Test Report

**Date**: [DATE]
**Tester**: [YOUR_NAME]
**Environment**: Development

## Test Results

### 1. Backend Startup
- Status: [✅ PASS / ❌ FAIL]
- Time: [__ seconds]
- Errors: [NONE / describe]

### 2. Frontend Startup
- Status: [✅ PASS / ❌ FAIL]
- URL: [http://localhost:____]
- Errors: [NONE / describe]

### 3. Authentication
- Status: [✅ PASS / ❌ FAIL]
- Method: [Email/Password / OAuth]
- Issues: [NONE / describe]

### 4. Scenario Creation
- Status: [✅ PASS / ❌ FAIL]
- Scenario Name: [NAME]
- Recording URL: [URL]

### 5. Recording Start
- Status: [✅ PASS / ❌ FAIL]
- Method: [playwright / proxy]
- Time to start: [__ seconds]

### 6. Step Capture
- Status: [✅ PASS / ❌ FAIL]
- Steps performed: [NUMBER]
- Steps captured: [NUMBER]
- Real-time update: [YES / NO]

### 7. Recording Stop
- Status: [✅ PASS / ❌ FAIL]
- Total steps: [NUMBER]
- Duration: [__ seconds]
- Steps accuracy: [___%]

### 8. Database Persistence
- Status: [✅ PASS / ❌ FAIL]
- Steps saved: [NUMBER]
- Retrieval successful: [YES / NO]

## Overall Result

- **Status**: [✅ PASS / ⚠️ PARTIAL / ❌ FAIL]
- **Issues Found**: [NONE / describe]
- **Recommendations**: [describe]

## Notes

[Any additional observations]
```

---

## 🚨 Critical Issues to Watch For

### Must Work:
- ✅ Recording starts with method: 'playwright'
- ✅ Steps are captured in real-time
- ✅ Steps are saved to database
- ✅ No crash or hangs
- ✅ Browser console is clean

### Acceptable Warnings:
- ⚠️ Deprecation warnings
- ⚠️ Dev server warnings
- ⚠️ Minor console messages

### Must NOT Happen:
- ❌ Proxy window opens (old behavior)
- ❌ Recording fails to start
- ❌ Steps lost after stop
- ❌ Database errors
- ❌ Browser crashes

---

## 🎯 Testing Flow Summary

```
1. Backend Running ✅
   ↓
2. Start Frontend
   ↓
3. Login to App
   ↓
4. Create Scenario
   ↓
5. Start Recording
   ↓
6. Perform Interactions
   ↓
7. Stop Recording
   ↓
8. Verify Steps Saved
   ↓
✅ TESTING COMPLETE
```

---

## 📞 Need Help?

### Reference Documentation
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Commands and configs
- [RECORDER_2.0_GUIDE.md](RECORDER_2.0_GUIDE.md) - Technical details
- [FINAL_TEST_REPORT.md](FINAL_TEST_REPORT.md) - Automated test results

### Check Logs
```bash
# Backend logs
tail -f backend/nohup.out

# Frontend dev server
Check browser DevTools → Console

# Browser processes
ps aux | grep chromium
```

### Verify Setup
```bash
# Backend health
curl http://localhost:5001/health

# API endpoints
curl http://localhost:5001/api/docs

# Database
Check PostgreSQL connection in backend logs
```

---

## ✨ What to Expect

### ✅ NEW Features (v2.0):
- **Headless recording**: No proxy window
- **Server-controlled**: Backend manages browser
- **Real-time polling**: 1.5s updates
- **Step extraction**: Via page.evaluate()
- **Better reliability**: 95%+ success rate

### 🔄 Differences from v1.1:
- No proxy window management
- No CSP violations
- No window.postMessage complexity
- Better for CI/CD pipelines
- Works in headless environments

---

## 🎉 After Testing

Once manual testing succeeds:

1. ✅ Fill test report template
2. ✅ Document any issues found
3. ✅ Capture screenshots
4. ✅ Update this guide with findings
5. ✅ Proceed to production deployment

---

**Ready to test? Start with Step 1 above!**

For detailed API information, see [RECORDER_2.0_GUIDE.md](RECORDER_2.0_GUIDE.md#api-reference)
