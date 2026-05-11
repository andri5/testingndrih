# 🆘 Multi-Laptop Quick Troubleshooting & Checklist

## ✅ Pre-Setup Checklist (Before First Run)

- [ ] Docker Desktop installed & running
- [ ] Git installed
- [ ] Port 3000 available (frontend)
- [ ] Port 5432 available (database)
- [ ] Repository cloned: `git clone https://github.com/andri5/testingndrih.git`
- [ ] Working directory: `cd testingndrih`

---

## 🚀 Quickest Setup (Copy & Paste)

### Windows Users:
```batch
setup-docker.bat setup
setup-docker.bat start
```

### Mac/Linux Users:
```bash
bash setup-docker.sh setup
bash setup-docker.sh start
```

**Then open:** http://localhost:3000

**Login:** admin@testingndrih.local / changeme123

---

## 🖥️ 2-Laptop Setup (Copy & Paste)

### Laptop 1 (Database Host):
```bash
cd testingndrih
docker-compose up -d
# Note your IP address:
# Windows: ipconfig → IPv4 Address
# Mac/Linux: ifconfig → inet
```

### Laptop 2 (Connected to Laptop 1):
```bash
cd testingndrih

# Edit .env - change this line:
# DATABASE_URL=postgresql://testingndrih_user:testpass123@postgres:5432/testingndrih
# To:
# DATABASE_URL=postgresql://testingndrih_user:testpass123@LAPTOP_1_IP:5432/testingndrih

# Then start:
docker-compose up -d

# Access at:
# http://localhost:3000 (same as Laptop 1)
```

---

## 🔧 Common Issues & Fixes

### ❌ "Port already in use" (port 3000)

**Cause:** Another app using port 3000

**Fix - Option 1 (Quick):**
```bash
# Windows:
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# Mac/Linux:
lsof -i :3000
kill -9 <PID>
```

**Fix - Option 2 (Docker only):**
```bash
# Change port in .env or docker-compose.yml:
FRONTEND_PORT=3002
# Then: docker-compose up -d
# Access: http://localhost:3002
```

---

### ❌ "Cannot connect to database"

**Check on Laptop 1:**
```bash
# Is database running?
docker-compose ps
# Should see "testingndrih-db" with status "healthy"

# Is port 5432 open?
netstat -ano | findstr :5432
# (Windows)
```

**Check on Laptop 2:**
```bash
# Can you reach Laptop 1?
ping LAPTOP_1_IP

# Check .env DATABASE_URL:
# Should be: postgresql://...@LAPTOP_1_IP:5432/testingndrih
# NOT: postgresql://...@postgres:5432/testingndrih
```

**Fix - Open Firewall (if using firewall):**
```bash
# Windows: Allow Port 5432
# Settings > Windows Defender Firewall > Inbound Rules > New Rule
# Port: 5432, TCP, Allow

# Mac: Allow Port 5432
# System Preferences > Security & Privacy > Firewall Options
# Or: sudo ufw allow 5432

# Linux:
sudo ufw allow 5432
```

---

### ❌ "API docs showing 500 error"

**Cause:** Prisma client mismatch (old backend)

**Fix:**
```bash
# Stop & clean
docker-compose down -v

# Rebuild
docker-compose build --no-cache

# Start fresh
docker-compose up -d

# Wait 20 seconds, then refresh browser
```

---

### ❌ "Frontend loading but blank screen"

**Cause:** Frontend connecting to wrong backend

**Check:**
1. Browser console (F12) for errors
2. Network tab: requests going to correct backend?
3. Check CORS_ORIGIN in .env

**Fix:**
```bash
# Edit .env - ensure correct origin:
# For local: CORS_ORIGIN=http://localhost:3000
# For multi-laptop: CORS_ORIGIN=http://LAPTOP_IP:3000

docker-compose down
docker-compose up -d

# Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

---

### ❌ "Login failed or session expires quickly"

**Check:**
1. Database connection working?
2. JWT_SECRET in .env exists?

**Fix:**
```bash
# Verify .env has:
JWT_SECRET=<long-random-string>
JWT_EXPIRES_IN=7d

# Recreate user:
docker-compose exec app npm run db:seed

# Try login again
```

---

### ❌ "Scenario execution times out or hangs"

**Cause:** Playwright browser not starting

**Check:**
```bash
# View logs:
docker-compose logs app | grep -i chromium
```

**Fix:**
```bash
# Restart app container:
docker-compose restart app

# Or recreate:
docker-compose down
docker-compose up -d

# Check browser option in UI:
# Try "Headless" mode if not working
```

---

## 📊 Docker Commands Cheatsheet

```bash
# Status
docker-compose ps                    # See all containers
docker-compose logs -f               # Live logs
docker-compose logs app              # Specific container logs

# Control
docker-compose up -d                 # Start background
docker-compose stop                  # Pause containers
docker-compose start                 # Resume containers
docker-compose restart               # Restart all
docker-compose down                  # Stop all (keep data)
docker-compose down -v               # Stop all (DELETE data)

# Management
docker-compose build                 # Build images
docker-compose build --no-cache      # Force rebuild
docker-compose exec app sh           # Shell into app
docker-compose exec postgres psql -U testingndrih_user -d testingndrih  # DB shell

# Health
docker ps --format "{{.Names}}\t{{.Status}}"  # Quick status
docker-compose exec -T postgres pg_isready    # DB health
```

---

## 🔄 Sync Database Between Laptops

### Export (Laptop 1):
```bash
docker-compose exec -T postgres pg_dump \
  -U testingndrih_user testingndrih \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# File saved in project directory
```

### Import (Laptop 2):
```bash
# Copy backup file to Laptop 2 first, then:
docker-compose exec -T postgres psql \
  -U testingndrih_user testingndrih < backup_20260508_120000.sql
```

---

## 📋 After-Setup Checklist

- [ ] Frontend loads at http://localhost:3000
- [ ] API docs show at http://localhost:3000/api/docs
- [ ] Can login with admin@testingndrih.local / changeme123
- [ ] Dashboard shows "Welcome" message
- [ ] Can create new scenario
- [ ] Can add test step to scenario
- [ ] Can run scenario (button shows "Running...")
- [ ] Execution completes with status (PASSED/FAILED)

---

## 🎯 Testing Multi-Laptop Connectivity

### Test 1: Laptop 1 DB visible from Laptop 2

```bash
# On Laptop 2:
# Find Laptop 1's IP:

# Windows:
ipconfig  # Look for IPv4 Address (e.g., 192.168.1.100)

# Mac/Linux:
ifconfig  # Look for inet (e.g., 192.168.1.100)

# Then test connection:
# (Assuming PostgreSQL client installed)
psql -h LAPTOP_1_IP -U testingndrih_user -d testingndrih -c "SELECT COUNT(*) FROM users"

# Should return a number, not an error
```

### Test 2: Frontend to Backend communication

```bash
# Open browser console (F12) on Laptop 2
# Go to http://localhost:3000
# Check:
# - Network tab → API calls should go to correct origin
# - Console → No CORS errors

# If CORS error, update .env on both laptops:
# CORS_ORIGIN=http://LAPTOP_2_IP:3000
```

### Test 3: Database sync

```bash
# On Laptop 1:
# Create a test scenario

# On Laptop 2:
# Should see same scenario immediately (if using same DB)
# If not, check .env DATABASE_URL on Laptop 2
```

---

## 🚨 Nuclear Option (When Everything Broken)

```bash
# Stop everything
docker-compose down -v

# Remove images too
docker rmi testingndrih-app postgres:16-alpine

# Start from scratch
docker-compose build --no-cache
docker-compose up -d

# Wait 20 seconds
# Open http://localhost:3000
```

---

## 📞 Still Having Issues?

1. **Check logs first:**
   ```bash
   docker-compose logs app | head -50
   docker-compose logs postgres | head -50
   ```

2. **Check network:**
   ```bash
   docker network ls
   docker network inspect testingndrih_testingndrih-network
   ```

3. **Verify ports:**
   ```bash
   netstat -ano | findstr :3000
   netstat -ano | findstr :5432
   ```

4. **Check Docker stats:**
   ```bash
   docker stats
   # See CPU, memory usage
   ```

5. **Browse error pages:**
   - http://localhost:3000/health (backend health)
   - http://localhost:3000/api/docs (API documentation)

---

**Last Updated:** May 8, 2026  
**Version:** 2.0.0-multi-laptop
