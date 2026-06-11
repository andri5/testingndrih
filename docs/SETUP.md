# 🚀 Setup & Installation Guide

Last Updated: May 13, 2026

---

## Prerequisites

Ensure you have the following installed:

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ or **yarn**
- **PostgreSQL** 14+ (for local development)
- **Git** for version control
- **Docker & Docker Compose** (optional, for containerized setup)

**Verify Installation:**
```bash
node --version
npm --version
psql --version
docker --version
```

---

## 🔧 Quick Start (Local Development)

### 1. Clone & Install

```bash
# Clone repository
git clone <repository-url>
cd testingndrih

# Install root dependencies (monorepo)
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Key variables:
# - DATABASE_URL=postgresql://user:password@localhost:5432/testingndrih
# - JWT_SECRET=your-secret-key
# - EMAIL_USER / EMAIL_PASS (for password reset)
```

### 3. Database Setup

```bash
# Navigate to backend
cd backend

# Install backend dependencies
npm install

# Setup database (migrations + seed)
npx prisma migrate deploy
npx prisma db seed

# Verify connection
npx prisma db pull
```

### 4. Start Development Servers

**Terminal 1 - Backend API:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5001
```

**Terminal 2 - Frontend App:**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3001
```

### 5. Access Application

- Frontend: http://localhost:3001
- Backend API: http://localhost:5001/api
- Default credentials: (check seed.js)

---

## 🐳 Docker Setup

### Option 1: Full Stack with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Services:**
- PostgreSQL: `localhost:5432`
- Backend API: `http://localhost:5001`
- Frontend: `http://localhost:3001` (via Nginx)

### Option 2: Individual Containers

```bash
# Build backend image
cd backend
docker build -t testingndrih-backend .

# Build frontend image
cd frontend
docker build -t testingndrih-frontend .

# Run with network
docker network create testnet
docker run -d --network testnet -p 5001:5001 testingndrih-backend
docker run -d --network testnet -p 3001:3001 testingndrih-frontend
```

---

## 📦 Backend Setup Details

### Install Dependencies

```bash
cd backend
npm install
```

### Key npm Scripts

```json
{
  "dev": "nodemon --exec babel-node src/server.js",
  "start": "node dist/server.js",
  "build": "babel src -d dist",
  "test": "jest",
  "seed": "node seed.js",
  "migrate": "prisma migrate dev",
  "migrate:deploy": "prisma migrate deploy"
}
```

### Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name add_feature

# Deploy migrations to production
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Reset database (DANGER: deletes all data)
npx prisma migrate reset
```

### Environment Variables (Backend)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/testingndrih

# Server
PORT=5001
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Email (Password Reset)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Playwright
PLAYWRIGHT_BROWSERS_PATH=/path/to/browsers

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3001
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- authController.test.js

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

---

## 🎨 Frontend Setup Details

### Install Dependencies

```bash
cd frontend
npm install
```

### Key npm Scripts

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest",
  "e2e": "playwright test",
  "lint": "eslint src --fix"
}
```

### Environment Variables (Frontend)

```env
# API Configuration
VITE_API_URL=http://localhost:5001/api
VITE_APP_NAME=Test Sambil Ngopi
VITE_APP_VERSION=3.0.0
```

### Development Features

- **Hot Module Reload (HMR)**: Automatic refresh on file changes
- **Vite Dev Server**: Ultra-fast build tool
- **TailwindCSS**: Utility-first CSS framework
- **Light Theme**: Fixed light UI for readability (no theme toggle)
- **English UI**: All labels and exports use English (`en-US`)

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests (Playwright)
npm run e2e

# E2E with UI
npm run e2e -- --ui

# E2E specific file
npm run e2e -- auth.spec.js
```

### Building for Production

```bash
# Create optimized build
npm run build

# Preview production build
npm run preview

# Analyze bundle size
npm run build -- --analyze
```

---

## 🔐 Authentication Setup

### JWT Configuration

1. Generate a strong JWT secret:
   ```bash
   openssl rand -base64 32
   ```

2. Add to `.env`:
   ```env
   JWT_SECRET=your-generated-secret-here
   ```

### Email Configuration (Password Reset)

1. If using Gmail:
   - Enable 2-Factor Authentication
   - Generate App Password: https://myaccount.google.com/apppasswords
   - Add to `.env`:
     ```env
     EMAIL_SERVICE=gmail
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASS=your-app-password
     ```

2. If using other services:
   - Configure in `backend/src/services/emailService.js`
   - Update `.env` with SMTP credentials

---

## 🗄️ Database Schema

### Key Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Scenarios (Test cases)
CREATE TABLE scenarios (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TestSteps (Individual actions)
CREATE TABLE testSteps (
  id UUID PRIMARY KEY,
  scenarioId UUID REFERENCES scenarios(id),
  type VARCHAR NOT NULL,
  description TEXT,
  order INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Executions (Test runs)
CREATE TABLE executions (
  id UUID PRIMARY KEY,
  scenarioId UUID REFERENCES scenarios(id),
  status VARCHAR NOT NULL,
  duration INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Prisma Migrations

All schema changes are tracked in `backend/prisma/migrations/`:

```bash
# View current schema
npx prisma studio

# Generate Prisma client
npx prisma generate

# Validate schema
npx prisma validate
```

---

## 🔍 Verification Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL running
- [ ] `.env` file configured
- [ ] Database migrations applied
- [ ] Backend starts on port 5001
- [ ] Frontend starts on port 3001
- [ ] Can login with seed credentials
- [ ] Can create and execute scenarios
- [ ] Can export reports (PDF/CSV/JSON)

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 5001
netstat -ano | findstr :5001

# Kill process
taskkill /PID <PID> /F
```

### Database Connection Error

```bash
# Check PostgreSQL is running
psql -U postgres -d testingndrih

# View connection string
echo $DATABASE_URL

# Test connection
npm run backend -- npx prisma db execute --stdin
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Hot Reload Not Working

```bash
# Restart Vite dev server
# Terminal: Ctrl+C then npm run dev
```

### Halaman `/api-testing` Blank atau Error 500

Vite dev server mem-proxy path yang diawali `/api` ke backend. Route SPA `/api-testing` harus **tidak** ikut ter-proxy.

Pastikan `frontend/vite.config.js` memiliki `bypass` agar hanya `/api/...` yang di-proxy, lalu restart dev server:

```bash
cd frontend
# Ctrl+C lalu:
npm run dev
```

Akses frontend di **http://localhost:3001** (bukan 3000 — port 3000 biasanya Docker).

---

## 📚 Additional Resources

- **Vite Documentation**: https://vitejs.dev
- **React Documentation**: https://react.dev
- **TailwindCSS**: https://tailwindcss.com
- **Express.js**: https://expressjs.com
- **Prisma**: https://www.prisma.io
- **Playwright**: https://playwright.dev

---

## 🤝 Contributing

Lihat [`CONTRIBUTING.md`](../CONTRIBUTING.md) di root project.

1. Create feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/my-feature`
4. Create Pull Request

### Code Quality

```bash
# Run linter
npm run lint

# Format code
npm run format

# Run tests before committing
npm test
npm run e2e
```

---

## 📧 Support

For issues or questions:
- Check documentation in `/docs`
- Review GitHub Issues
- Contact development team

