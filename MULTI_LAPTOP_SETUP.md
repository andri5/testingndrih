# 🖥️ Multi-Laptop Setup Guide

Panduan lengkap untuk menjalankan TestingNDRIH konsisten di 2 laptop atau lebih.

---

## 📌 Rekomendasi: Docker (RECOMMENDED)

Menggunakan **Docker** adalah cara paling reliable untuk memastikan aplikasi berjalan sama di berbagai mesin tanpa perbedaan environment.

### Keuntungan Docker:
✅ Konsistensi 100% - sama di semua laptop  
✅ Tidak perlu install Node, PostgreSQL, Playwright secara manual  
✅ Isolasi environment - tidak ada konflik dengan aplikasi lain  
✅ Mudah di-reset atau di-update  
✅ Production-ready setup  

---

## 🚀 Quick Start - Docker (1 Command)

### Prerequisites di Laptop 1 dan Laptop 2:
- ✅ Docker Desktop (https://www.docker.com/products/docker-desktop/)
- ✅ Git
- ✅ Browser (Chrome, Firefox, Edge, Safari)

### Setup (sama untuk semua laptop):

```bash
# 1. Clone repository
git clone https://github.com/andri5/testingndrih.git
cd testingndrih

# 2. Copy environment file
cp .env.example .env

# (Opsional) Edit .env jika perlu customize database/email
# Tapi defaults sudah OK untuk development

# 3. Start semua services (one command)
docker-compose up -d

# 4. Wait 10-15 seconds untuk initialization
# Lihat status dengan:
docker-compose logs -f

# 5. Access aplikasi:
# Frontend: http://localhost:3000
# Backend API: http://localhost:3000/api/docs
# Default login: admin@testingndrih.local / changeme123
```

### Selesai! ✅

---

## 🛑 Stop Services

```bash
# Stop semua containers (data tetap tersimpan)
docker-compose down

# Stop & hapus data (fresh start)
docker-compose down -v
```

---

## 🔄 Sync Data Between Laptops

### Option 1: Git + Database Export/Import

```bash
# Laptop 1 - Export data
docker-compose exec -T postgres pg_dump \
  -U testingndrih_user testingndrih \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Copy backup_*.sql ke Laptop 2 via:
# - Git (commit & push)
# - USB drive
# - Cloud storage (Dropbox, Google Drive)

# Laptop 2 - Import data
docker-compose exec -T postgres psql \
  -U testingndrih_user testingndrih < backup_20260508_120000.sql
```

### Option 2: Remote PostgreSQL (Cloud Database)

Untuk sync real-time tanpa manual export:

```bash
# .env - ubah DATABASE_URL ke cloud database
DATABASE_URL=postgresql://user:pass@cloud-db-host:5432/testingndrih

# Restart services
docker-compose down
docker-compose up -d
```

Recommended cloud databases:
- **Railway.app** (free tier)
- **Supabase** (PostgreSQL hosted, free tier 500MB)
- **Heroku PostgreSQL** (paid)
- **AWS RDS** (paid)

---

## 💻 Alternative: Local Setup (Manual) - Windows/Mac/Linux

Jika tidak ingin pakai Docker:

### Prerequisites:
- **Node.js** v18+ (https://nodejs.org/)
- **PostgreSQL** 14+ (https://www.postgresql.org/)
- **Git**

### Setup Laptop 1:

```bash
# 1. Clone & navigate
git clone https://github.com/andri5/testingndrih.git
cd testingndrih

# 2. Setup backend
cd backend
cp .env.example .env

# Edit .env:
# DATABASE_URL=postgresql://testingndrih_user:testpass123@localhost:5432/testingndrih
# JWT_SECRET=your-secret-key-change-me

npm install
npx prisma migrate deploy
npm run db:seed  # Seed sample data
npm run dev      # Start backend on port 5001

# In another terminal - setup frontend
cd frontend
npm install
npm run dev      # Start frontend on port 3001
```

### Setup Laptop 2:

**Sama persis** dengan Laptop 1, tapi perhatikan:

```bash
# ❌ PROBLEM: PostgreSQL lokal di Laptop 2 akan kosong
# ✅ SOLUTION: Gunakan database Laptop 1

# Di Laptop 1 (backend): lihat IP address
ipconfig getifaddr en0  # macOS/Linux
ipconfig              # Windows - cari IPv4 Address

# Di Laptop 2 (.env):
DATABASE_URL=postgresql://testingndrih_user:testpass123@LAPTOP_1_IP:5432/testingndrih

# Restart backend Laptop 2
npm run dev
```

---

## 🔧 Troubleshooting Multi-Laptop Setup

### ❌ Problem: Port sudah terpakai di Laptop 2

```bash
# Ubah port di .env atau docker-compose.yml
# Frontend dari 3000 ke 3002:

# docker-compose.yml
ports:
  - "3002:3000"  # akses di http://localhost:3002

# Atau via environment variable:
export FRONTEND_PORT=3002
docker-compose up -d
```

### ❌ Problem: Database connection error di Laptop 2

```bash
# 1. Pastikan PostgreSQL aktif di Laptop 1:
docker-compose ps
# Harus ada container "testingndrih-db" dengan status "running"

# 2. Test koneksi dari Laptop 2:
psql -h LAPTOP_1_IP -U testingndrih_user -d testingndrih -c "SELECT 1"

# 3. Jika firewall blocking: buka port 5432 di Laptop 1
# Windows: Windows Defender Firewall > Inbound Rules > New Rule
# Mac/Linux: sudo ufw allow 5432
```

### ❌ Problem: Frontend tidak bisa akses API di Laptop 2

```bash
# 1. Dalam docker-compose.yml, pastikan CORS_ORIGIN sesuai:
CORS_ORIGIN: http://LAPTOP_2_IP:3000

# 2. Atau jika pakai manual setup, backend harus accept dari Laptop 2:
# backend/.env:
CORS_ORIGIN=http://LAPTOP_2_IP:5001
```

### ❌ Problem: Playwright browser tidak mau jalan di Laptop 2

```bash
# Docker sudah include Xvfb (virtual display), jadi OK
# Jika manual setup:

# Windows: gunakan headed mode (default)
# Mac/Linux: pastikan Xvfb terinstall
sudo apt-get install xvfb  # Linux

# Atau jalankan headless:
# Saat execute scenario: pilih "Headless" checkbox
```

---

## 📋 Checklist - Before Testing on Laptop 2

- [ ] Docker Desktop installed & running
- [ ] Git installed
- [ ] Repository cloned (`git clone ...`)
- [ ] `.env` file copied (`cp .env.example .env`)
- [ ] `docker-compose up -d` executed
- [ ] Wait 15 seconds for initialization
- [ ] Check logs: `docker-compose logs -f` (no errors)
- [ ] Frontend loads: http://localhost:3000 ✅
- [ ] Backend API docs: http://localhost:3000/api/docs ✅
- [ ] Login works: admin@testingndrih.local / changeme123 ✅
- [ ] Create & run a scenario ✅

---

## 🔄 Sync Strategy Between Laptops

### Best Practice for Team Setup:

```
Laptop 1 (Primary)          Laptop 2 (Secondary)
├─ Docker services          ├─ Docker services (connected)
├─ PostgreSQL               ├─ Points to Laptop 1 DB
├─ IP: 192.168.1.100       ├─ IP: 192.168.1.101
└─ Pushes code to Git       └─ Pulls code from Git
```

**Workflow:**

1. **Laptop 1** membuat scenario baru → database update
2. **Laptop 2** jalankan `git pull` → code sync
3. **Laptop 2** buka aplikasi → otomatis connect ke Laptop 1 DB
4. **Laptop 2** bisa see & run scenario dari Laptop 1 ✅

---

## 📱 Mobile/Tablet Testing (Bonus)

Untuk test di device lain (phone, tablet) di same network:

```bash
# Lihat IP address Docker host:
docker inspect testingndrih-app | grep IPAddress

# Atau di laptop:
ifconfig  # Mac/Linux
ipconfig  # Windows

# Access dari mobile browser:
http://LAPTOP_IP:3000

# Di mobile, login & test scenario sama seperti desktop
```

---

## 🐳 Docker Commands Reference

```bash
# Lihat status services
docker-compose ps

# Lihat logs real-time
docker-compose logs -f

# Lihat logs satu service
docker-compose logs -f app
docker-compose logs -f postgres

# Stop semua (data saved)
docker-compose down

# Stop + hapus data
docker-compose down -v

# Restart semua
docker-compose restart

# Masuk ke container bash
docker-compose exec app sh
docker-compose exec postgres sh

# Database shell
docker-compose exec postgres psql -U testingndrih_user -d testingndrih

# Clear cache & rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## ✅ Recommended Setup for 2 Laptops

### Setup:
- **Laptop 1**: Backend + PostgreSQL (Docker)
- **Laptop 2**: Frontend + Backend (Docker, points to Laptop 1 DB)

### Commands:

**Laptop 1:**
```bash
cd testingndrih
docker-compose up -d postgres app
```

**Laptop 2:**
```bash
cd testingndrih

# Edit .env:
# DATABASE_URL=postgresql://testingndrih_user:testpass123@LAPTOP_1_IP:5432/testingndrih

docker-compose up -d
```

---

## 📞 Support

Jika ada masalah:

1. Check logs: `docker-compose logs -f`
2. Restart: `docker-compose down && docker-compose up -d`
3. Check network: `docker network ls`
4. Test database: `docker-compose exec postgres pg_isready`

---

**Happy Testing! 🚀**
