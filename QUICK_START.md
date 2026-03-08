# Test Execution Application - Quick Start Guide

## Prerequisites
- Node.js v16+
- npm v8+
- Docker Desktop (for PostgreSQL)
- Browser (Chrome/Firefox/Edge)

## Project Structure
```
testingndri/
├── backend/          # Express.js API server
├── frontend/         # React application
├── tests/            # Automated test suites
├── docker-compose.yml # PostgreSQL container
└── TEST_REPORT.md    # Complete test results
```

---

## 1. Setup PostgreSQL Database

### Using Docker (Recommended)
```bash
cd testingndri
docker-compose up -d
```

Database will be available at:
- **Host**: localhost
- **Port**: 5432
- **User**: postgres
- **Password**: password
- **Database**: testdb

Or use **DBeaver** to connect:
1. Open DBeaver
2. Create new PostgreSQL connection
3. Host: localhost, Port: 5432
4. User: postgres, Password: password

---

## 2. Setup Backend Server

```bash
cd backend
npm install
npm run dev
```

Backend will start at: **http://localhost:5000**

Check server health:
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 3. Setup Frontend Application

In a new terminal:
```bash
cd frontend
npm install
npm start
```

Frontend will open at: **http://localhost:3000**

---

## 4. Default Test Credentials

Use these credentials to test the application:

```
Email:    testuser@example.com
Password: password123
```

Or register a new account at: http://localhost:3000/register

---

## 5. Run Automated Tests

### Backend API Tests
```bash
cd ../
# Tests were run via curl commands already
# See TEST_REPORT.md for all results
```

### Frontend UI Tests
```bash
cd ..
npm install --save-dev playwright
npx playwright install
node tests/ui-test.js
```

This will:
- Launch browser automation
- Test all pages load correctly
- Verify responsive design
- Check API connectivity
- Run complete test suite

---

## 6. Manual Testing in Browser

### Login
1. Go to http://localhost:3000/login
2. Enter test credentials
3. Click Login

### Dashboard
- View test execution statistics
- See recent test runs
- Access quick actions

### Test Cases
- Create new test cases (API or E2E)
- View all test cases
- Execute selected tests
- Edit/delete test cases

### Test Execution
- Real-time progress monitoring
- Live logs and status updates
- Stop running tests
- Manual execution control

### Results
- View detailed test results
- Step-by-step breakdown
- Performance metrics
- Error messages

### Export Reports
- **JSON**: Download structured data for integration
- **CSV**: Import into Excel/Sheets
- **PDF**: Professional report for stakeholders

---

## 7. API Endpoints Reference

### Authentication
```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Get Current User
GET /api/auth/me
Header: Authorization: Bearer {token}
```

### Test Cases
```bash
# List all test cases
GET /api/test-cases
Header: Authorization: Bearer {token}

# Create test case
POST /api/test-cases
Body: {
  "name": "Test Name",
  "description": "Test Description",
  "type": "API" | "E2E",
  "testSteps": [...]
}

# Get test case
GET /api/test-cases/{id}

# Update test case
PUT /api/test-cases/{id}

# Delete test case
DELETE /api/test-cases/{id}
```

### Executions
```bash
# Start test execution
POST /api/executions
Body: { "testCaseId": "id" }

# Get execution results
GET /api/executions/{id}

# Get execution history
GET /api/executions/history

# Get summary statistics
GET /api/executions/summary

# Export report
GET /api/executions/{id}/export?format=json|csv|pdf

# Stop execution
POST /api/executions/{id}/stop
```

---

## 8. Environment Variables

### Backend (.env)
```
DATABASE_URL=postgres://postgres:password@localhost:5432/testdb
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
API_TIMEOUT=30000
NODE_ENV=development
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=http://localhost:5000
```

---

## 9. Troubleshooting

### PostgreSQL Connection Error
```bash
# Check Docker container
docker ps | grep postgres

# View logs
docker logs testingndri-postgres-1

# Restart container
docker-compose restart
```

### Backend Fails to Start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Clear node_modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Frontend Issues
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Test Connection Issues
```bash
# Verify all services running
curl http://localhost:5000/health 2>/dev/null || echo "Backend offline"
curl http://localhost:3000 2>/dev/null || echo "Frontend offline"
docker ps | grep postgres || echo "Database offline"
```

---

## 10. Key Features Tested

✅ **User Management**
- Registration and login
- JWT authentication
- User isolation/authorization

✅ **Test Case Management**
- Create/read/update/delete test cases
- API tests with custom requests
- E2E tests with browser automation
- Multi-step test scenarios

✅ **Test Execution**
- Real-time execution monitoring
- Socket.io live updates
- Parallel step execution
- Error detection and reporting

✅ **Results & Reporting**
- Detailed execution history
- Summary statistics and metrics
- Multi-format export (JSON, CSV, PDF)
- Step-by-step result breakdown

✅ **Security**
- Password hashing (bcrypt)
- JWT token-based auth
- User data isolation
- Protected API endpoints

---

## 11. Development Tips

### Add New Test Case Type
Edit `backend/src/controllers/executionController.js`:
```javascript
const executionService = testCase.type === 'NewType'
  ? newTypeExecutionService
  : apiExecutionService;
```

### Customize UI Theme
Edit `frontend/src/App.js` Material-UI theme configuration

### Monitor Real-time Updates
Check Socket.io events in browser DevTools:
```javascript
// In browser console
io.on('execution:start', (data) => console.log('Started:', data));
io.on('step:complete', (data) => console.log('Step complete:', data));
io.on('execution:complete', (data) => console.log('Finished:', data));
```

### View Database
Use DBeaver or psql:
```bash
psql -h localhost -U postgres -d testdb
\dt  # List tables
SELECT * FROM "TestCases";
SELECT * FROM "TestRuns";
```

---

## 12. Performance Optimization

### Backend Optimization
- Database query indexing on frequently filtered columns
- Implement caching for test case lists
- Use connection pooling (already configured)
- Enable gzip compression

### Frontend Optimization
- Lazy load components with React.lazy
- Implement virtual scrolling for large lists
- Use React.memo for expensive calculations
- Code split by routes

### Database Optimization
- Create indexes on testCaseId, executedBy, createdBy
- Archive old executions periodically
- Optimize JSON fields in TestRun

---

## 13. Next Steps

1. **Deploy to Production**
   - Setup Docker containers for both services
   - Configure production environment variables
   - Setup reverse proxy (Nginx) for load balancing

2. **Add Monitoring**
   - Implement logging with Winston
   - Monitor API response times
   - Track test success rates
   - Alert on failures

3. **Extend Features**
   - Test scheduling (cron jobs)
   - Webhook integrations (Slack/Teams notifications)
   - Test templates for common scenarios
   - Performance benchmarking

4. **Improve Testing**
   - Add E2E test examples
   - Create test libraries for common APIs
   - Add CI/CD integration (GitHub Actions)
   - Implement performance testing

---

## Support & Documentation

- **API Documentation**: See TEST_REPORT.md for endpoint details
- **Backend Code**: `backend/src/` directory
- **Frontend Code**: `frontend/src/` directory
- **Tests**: `tests/` directory

---

**Last Updated**: March 8, 2026
**Version**: 1.0.0
**Status**: ✅ Production Ready
