# Contributing

Terima kasih sudah ingin berkontribusi ke **TestingNDRIH**!

## Setup Development

```bash
git clone https://github.com/andri5/testingndrih.git
cd testingndrih
npm install

# Backend
cd backend && cp .env.example .env
npx prisma migrate dev
npm run db:seed
npm run dev

# Frontend (terminal baru)
cd frontend && npm run dev
```

## Workflow Git

1. Sync `main`: `git checkout main && git pull`
2. Buat branch: `feat/nama-fitur`, `fix/nama-bug`, atau `hotfix/nama`
3. Tulis kode + test yang relevan
4. Commit dengan [Conventional Commits](#semantic-commit)
5. Push dan buka **Pull Request ke `main`**
6. Pastikan CI hijau (test, lint, E2E, commitlint)
7. Setelah merge → semantic-release membuat versi → deploy prod butuh **approval manual**

Branch `develop` tidak dipakai. Lihat [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) untuk alur rilis lengkap.

## Semantic commit

Format wajib:

```
<type>(<scope>): <deskripsi singkat>
```

| Type | Kapan |
|------|--------|
| `feat` | Fitur baru → bump **minor** |
| `fix` | Perbaikan bug → bump **patch** |
| `docs` | Dokumentasi saja |
| `test` | Test saja |
| `refactor` | Refactor tanpa ubah perilaku |
| `perf` | Peningkatan performa |
| `ci` | Perubahan CI/CD |
| `chore` | Maintenance, deps, config |

Contoh:

```
feat(api): add environment variable export
fix(ui): resolve sidebar link on mobile
chore: update dependencies
```

Breaking change:

```
feat(api)!: remove legacy auth endpoint

BREAKING CHANGE: /api/auth/legacy removed, use /api/auth/login
```

Validasi lokal (Husky) + CI pada PR.

## Testing sebelum PR

```bash
cd backend && npm test
cd backend && npm run test:security   # butuh API jalan — lihat docs/SECURITY_TESTING.md
cd frontend && npm run lint
cd frontend && npx playwright test e2e/platform-features-e2e.spec.js --project=chromium
npm run health-check   # opsional, butuh dev server
```

| Layer | Command |
|-------|---------|
| Backend unit | `cd backend && npm test` |
| Backend coverage | `cd backend && npm run test:coverage` |
| Frontend E2E | `cd frontend && npm run e2e` |
| Security (OWASP) | `npm run test:security` |
| Health check | `npm run health-check` |

Lihat [`docs/TESTING.md`](docs/TESTING.md) dan [`docs/SECURITY_TESTING.md`](docs/SECURITY_TESTING.md).

## Code Style

- Backend: ESLint + Prettier (`npm run lint`, `npm run format:write`)
- Frontend: ESLint + Prettier
- Ikuti pola yang sudah ada di file sekitar perubahan Anda

## Dokumentasi

Update docs jika menambah endpoint, halaman, atau fitur:

- `docs/API_ENDPOINTS.md` — referensi API
- `docs/DEPLOYMENT.md` — rilis & deploy production
- `docs/DIRECTORY_STRUCTURE.md` — struktur folder
- `docs/SECURITY_TESTING.md` — pentest & OWASP

## Pertanyaan

Buka [GitHub Issue](https://github.com/andri5/testingndrih/issues) untuk diskusi fitur atau bug.
