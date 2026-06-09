# 📖 Documentation Index

Welcome to the **Test Sambil Ngopi** documentation. This folder contains comprehensive guides for understanding, setting up, and developing the automated testing platform.

---

## 📚 Documentation Files

### [ARCHITECTURE.md](./ARCHITECTURE.md)
**Project Overview & Technical Architecture**
- Technology stack overview
- Project structure & modules
- Data flow diagram
- Feature modules breakdown
- Performance optimizations
- Deployment guide

*Read this to understand:* How the project is organized, what technologies are used, and how components interact.

---

### [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md)
**Complete Directory Layout**
- Full backend folder structure with file explanations
- Full frontend folder structure with file explanations
- Naming conventions & best practices
- File organization patterns
- File count summary

*Read this to understand:* Where to find specific files and how the codebase is organized.

---

### [SETUP.md](./SETUP.md)
**Installation & Configuration Guide**
- Prerequisites & system requirements
- Local development setup
- Docker setup instructions
- Backend configuration details
- Frontend configuration details
- Database migrations & schema
- Authentication setup
- Troubleshooting guide

*Read this to:* Set up the project on your local machine or in production.

---

### [API_ENDPOINTS.md](./API_ENDPOINTS.md)
**REST API Reference**
- All endpoints grouped by feature
- Auth requirements and base URL
- CI token usage

*Read this to:* Integrate with the API or debug requests during development.

---

### [TESTING.md](./TESTING.md)
**Testing Strategy & Guide**
- Backend unit, integration, security tests
- Frontend E2E (Playwright)
- Visual regression & environment variable testing
- CI/CD test workflow
- Coverage targets & troubleshooting

*Read this to:* Run tests and understand current test coverage.

---

## 🎯 Quick Navigation

### 🚀 Getting Started
1. **New to the project?** → Start with [ARCHITECTURE.md](./ARCHITECTURE.md)
2. **Need to set up locally?** → Follow [SETUP.md](./SETUP.md)
3. **Looking for a specific file?** → Check [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md)

### 💻 Development
- **Backend Development**: See [SETUP.md](./SETUP.md#-backend-setup-details)
- **Frontend Development**: See [SETUP.md](./SETUP.md#-frontend-setup-details)
- **Database Changes**: See [SETUP.md](./SETUP.md#-database-schema)
- **Testing**: See [TESTING.md](./TESTING.md)

### 🐳 Deployment
- **Release & Production Deploy**: See [DEPLOYMENT.md](./DEPLOYMENT.md) — branching, semantic commit, CI, approval deploy ke `testsambilngopi.com`
- **Docker Setup**: See [SETUP.md](./SETUP.md#-docker-setup)
- **Production Build**: See [SETUP.md](./SETUP.md#building-for-production)
- **Environment Variables**: See [SETUP.md](./SETUP.md#-backend-setup-details)

### 🔧 Configuration
- **JWT Setup**: See [SETUP.md](./SETUP.md#-authentication-setup)
- **Email Configuration**: See [SETUP.md](./SETUP.md#email-configuration-password-reset)
- **Database Connection**: See [SETUP.md](./SETUP.md#database-setup)

---

## 📊 Project Statistics

| Metric | Count |
|--------|-------|
| **Backend Controllers** | 22 |
| **Backend Services** | 30+ |
| **Backend Routes** | 24 |
| **Frontend Pages** | 33 |
| **Frontend Components** | 30+ |
| **Database Migrations** | 15 |
| **E2E Specs** | 16 |
| **Total Production Files** | 150+ |
| **Lines of Code** | 15,000+ |

---

## 🔑 Key Features

✅ **Test Recording**: Capture browser interactions  
✅ **Test Playback**: Replay recorded scenarios  
✅ **Smoke Testing**: Quick functionality checks  
✅ **Stress Testing**: Performance under load  
✅ **Security Testing**: Vulnerability scanning  
✅ **Parallel Execution**: Run multiple tests concurrently  
✅ **Cross-browser Testing**: Test on multiple browsers  
✅ **Scheduling**: Cron-based test automation  
✅ **Analytics & Reports**: Performance metrics  
✅ **PDF Export**: Generate professional reports  
✅ **API Testing**: HTTP request builder & assertions  
✅ **Issue Tracker**: Auto-create dari execution gagal  
✅ **Environment Variables**: `{{var}}` substitution  
✅ **Visual Regression**: Baseline capture & pixel diff  
✅ **CI/CD Integration**: API tokens & remote run  

---

## 🛠️ Technology Stack

### Frontend
- React 18 + Vite
- TailwindCSS
- Zustand (State Management)
- Playwright (Testing)
- Axios (HTTP Client)

### Backend
- Node.js + Express
- PostgreSQL
- Prisma (ORM)
- Playwright (Automation)
- JWT (Authentication)

### Infrastructure
- Docker & Docker Compose
- PostgreSQL Database
- Nginx Reverse Proxy

---

## 📖 How to Use This Documentation

1. **Read in Order**: ARCHITECTURE → DIRECTORY_STRUCTURE → SETUP
2. **Use as Reference**: Jump to specific sections as needed
3. **Search Keywords**: Look for section headers that match your question
4. **Check Troubleshooting**: See SETUP.md for common issues

---

## ❓ FAQ

### Q: How do I set up the project?
**A:** Follow [SETUP.md](./SETUP.md) for complete installation instructions.

### Q: Where is the user authentication code?
**A:** See `backend/src/controllers/authController.js` and `backend/src/services/authService.js`

### Q: How do I add a new test type?
**A:** Create a new service in `backend/src/services/`, controller in `backend/src/controllers/`, and routes in `backend/src/routes/`.

### Q: Where are the test scenarios stored?
**A:** All data is in PostgreSQL database, managed through Prisma ORM. Schema is in `backend/prisma/schema.prisma`.

### Q: How do I export a test report?
**A:** See `frontend/src/utils/exportUtils.js` for export functionality.

### Q: Where are environment variables defined?
**A:** Copy `.env.example` to `.env` and edit with your configuration.

---

## 🚀 Next Steps

1. **Setup**: Follow [SETUP.md](./SETUP.md) to get running locally
2. **Explore**: Review [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md) to understand the codebase
3. **Develop**: Start making changes and contributions
4. **Test**: Run unit and E2E tests before committing
5. **Deploy**: Use Docker Compose for production deployment

---

## 📞 Support

- **Issues**: Check GitHub Issues or create a new one
- **Questions**: Contact the development team
- **Bugs**: Report with reproduction steps and screenshots
- **Features**: Submit feature requests with use cases

---

## 📝 Document Updates

| Date | Version | Changes |
|------|---------|---------|
| May 13, 2026 | 3.0 | Created comprehensive documentation structure |
| June 4, 2026 | 3.1 | Cleanup unused files, update structure & testing docs |

---

**Last Updated:** June 4, 2026  
**Documentation Version:** 3.1  
**Project Version:** 3.0.0  
**Status:** Production Ready ✅

