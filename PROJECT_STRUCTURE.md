# Documentation Moved

Dokumentasi struktur project telah dipindahkan ke folder `/docs` agar lebih mudah dirawat.

## Dokumentasi Utama

| Dokumen | Isi |
|---------|-----|
| [`docs/README.md`](./docs/README.md) | Index dokumentasi |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Arsitektur & tech stack |
| [`docs/DIRECTORY_STRUCTURE.md`](./docs/DIRECTORY_STRUCTURE.md) | Struktur folder lengkap |
| [`docs/SETUP.md`](./docs/SETUP.md) | Instalasi & konfigurasi |
| [`docs/TESTING.md`](./docs/TESTING.md) | Strategi & panduan testing |

## Struktur Root (Ringkas)

```
testingndrih/
├── backend/              # API Express + Prisma + Playwright
├── frontend/             # React + Vite SPA
├── docs/                 # Dokumentasi terpusat
├── scripts/              # Utilitas root (health-check)
├── .github/workflows/    # CI/CD workflows
├── docker-compose.yml
├── Dockerfile
├── package.json          # Monorepo workspaces
└── README.md
```

**Last Updated:** June 4, 2026
