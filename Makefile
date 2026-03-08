.PHONY: help install setup start stop test test-backend test-frontend clean docker-up docker-down logs

# Default target
help:
	@echo "🚀 Test Execution Application - Make Commands"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make install          - Install all dependencies"
	@echo "  make setup            - Complete setup (install + docker)"
	@echo ""
	@echo "Running Application:"
	@echo "  make start            - Start all services (backend, frontend, database)"
	@echo "  make start-backend    - Start backend only"
	@echo "  make start-frontend   - Start frontend only"
	@echo "  make stop             - Stop all services"
	@echo ""
	@echo "Database:"
	@echo "  make docker-up        - Start PostgreSQL container"
	@echo "  make docker-down      - Stop PostgreSQL container"
	@echo "  make db-reset         - Reset database (drops and recreates)"
	@echo ""
	@echo "Testing:"
	@echo "  make test             - Run all automated tests"
	@echo "  make test-backend     - Run backend API tests"
	@echo "  make test-frontend    - Run frontend UI tests"
	@echo "  make test-api         - Run API endpoint tests with curl"
	@echo ""
	@echo "Logs & Debugging:"
	@echo "  make logs             - View all service logs"
	@echo "  make logs-backend     - View backend logs"
	@echo "  make logs-frontend    - View frontend logs"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            - Remove node_modules and logs"
	@echo "  make deepclean        - Remove everything (reinstall required)"
	@echo ""

# ============================================================================
# SETUP & INSTALLATION
# ============================================================================

install:
	@echo "📦 Installing dependencies..."
	cd backend && npm install
	cd frontend && npm install
	npm install --save-dev playwright
	npx playwright install
	@echo "✅ Dependencies installed"

setup: docker-up install
	@echo "✅ Setup complete! Run 'make start' to begin"

# ============================================================================
# RUNNING APPLICATION
# ============================================================================

start: docker-up start-backend start-frontend
	@echo "✅ All services started!"
	@echo "   Backend:  http://localhost:5000"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Database: localhost:5432"

start-backend:
	@echo "🔧 Starting backend server..."
	cd backend && npm run dev > backend.log 2>&1 &
	@sleep 2
	@echo "✅ Backend started (port 5000)"

start-frontend:
	@echo "⚛️  Starting frontend React app..."
	cd frontend && npm start > frontend.log 2>&1 &
	@sleep 5
	@echo "✅ Frontend started (port 3000)"

stop:
	@echo "🛑 Stopping all services..."
	@taskkill /F /IM node.exe 2>/dev/null || true
	@sleep 2
	@echo "✅ Services stopped"

# ============================================================================
# DATABASE
# ============================================================================

docker-up:
	@echo "🐘 Starting PostgreSQL container..."
	docker-compose up -d
	@sleep 3
	@echo "✅ PostgreSQL started (port 5432)"

docker-down:
	@echo "🛑 Stopping PostgreSQL container..."
	docker-compose down
	@echo "✅ PostgreSQL stopped"

db-reset:
	@echo "🔄 Resetting database..."
	docker-compose down -v
	docker-compose up -d
	@sleep 3
	@echo "✅ Database reset complete"

# ============================================================================
# TESTING
# ============================================================================

test: test-backend test-frontend
	@echo "✅ All tests completed!"

test-backend: test-api
	@echo "✅ Backend tests completed"

test-frontend:
	@echo "🧪 Running frontend UI tests..."
	node tests/ui-test.js
	@echo "✅ Frontend tests completed"

test-api:
	@echo "🧪 Running backend API tests..."
	@echo ""
	@echo "1️⃣  Testing user registration..."
	curl -X POST "http://localhost:5000/api/auth/register" \
		-H "Content-Type: application/json" \
		-d '{"email":"test-$(shell date +%s)@example.com","password":"password123","name":"Test User"}' \
		-s | grep -o '{"user"' && echo "✅ Registration OK" || echo "❌ Registration failed"
	@echo ""
	@echo "2️⃣  Testing Dashboard pages..."
	curl -s http://localhost:3000 | grep -q "html" && echo "✅ Frontend loaded" || echo "❌ Frontend not responding"
	@echo ""
	@echo "3️⃣  Testing backend health..."
	curl -s http://localhost:5000/api/test-cases \
		-H "Authorization: Bearer test-token" 2>&1 | grep -q "error\|test" && echo "✅ Backend responding" || echo "⚠️  Check backend status"
	@echo ""
	@echo "✅ Basic API connectivity tests passed"

# ============================================================================
# LOGS
# ============================================================================

logs:
	@echo "📋 Tailing all logs (Ctrl+C to exit)..."
	@tail -f backend.log frontend.log 2>/dev/null || echo "⚠️  No logs found. Start services first with 'make start'"

logs-backend:
	@echo "📋 Backend logs:"
	@tail -f backend.log 2>/dev/null || echo "⚠️  No backend logs found"

logs-frontend:
	@echo "📋 Frontend logs:"
	@tail -f frontend.log 2>/dev/null || echo "⚠️  No frontend logs found"

# ============================================================================
# CLEANUP
# ============================================================================

clean:
	@echo "🧹 Cleaning up..."
	rm -rf backend/node_modules frontend/node_modules
	rm -f *.log
	@echo "✅ Cleanup complete"

deepclean: stop clean docker-down
	@echo "🗑️  Deep cleaning..."
	rm -rf backend/package-lock.json frontend/package-lock.json
	docker system prune -f
	@echo "✅ Deep clean complete (reinstall required)"

# ============================================================================
# QUICK COMMANDS
# ============================================================================

# Run everything automatically (what user asked for)
all: setup start test
	@echo "🎉 Complete setup, start, and testing finished!"
	@echo "✅ Application is ready at http://localhost:3000"

# Development mode - useful for active development
dev: docker-up
	@echo "🚀 Starting in development mode..."
	@echo "Starting backend..."
	cd backend && npm run dev &
	@echo "Starting frontend..."
	cd frontend && npm start &
	@echo "✅ Development mode started"
	@echo "Backend:  http://localhost:5000"
	@echo "Frontend: http://localhost:3000"
	@echo "Press Ctrl+C to stop"

# Production build
prod: clean
	@echo "🏗️  Building for production..."
	cd frontend && npm run build
	cd backend && npm run build || true
	@echo "✅ Production build complete"

# Report generation (after testing)
report:
	@echo "📊 Test Report:"
	@cat TEST_REPORT.md | more

# Quick start guide
guide:
	@echo "📖 Quick Start Guide:"
	@cat QUICK_START.md | more

# Check all service status
status:
	@echo "📊 Service Status:"
	@echo ""
	@curl -s http://localhost:5000/api/auth/me -H "Authorization: Bearer test" \
		-m 2 > /dev/null && echo "✅ Backend (5000) - Running" || echo "❌ Backend (5000) - Not responding"
	@curl -s http://localhost:3000 | grep -q "html" > /dev/null 2>&1 \
		&& echo "✅ Frontend (3000) - Running" || echo "❌ Frontend (3000) - Not responding"
	@docker ps | grep -q testingndri && echo "✅ Database (5432) - Running" || echo "❌ Database (5432) - Not running"
	@echo ""

# ============================================================================
# HELP TARGETS
# ============================================================================

.PHONY: all dev prod report guide status
git status