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

## Workflow

1. Buat branch dari `main`: `feat/nama-fitur` atau `fix/nama-bug`
2. Tulis kode + test yang relevan
3. Jalankan sebelum commit:
   ```bash
   cd backend && npm test
   cd frontend && npm run lint
   npm run health-check   # opsional, butuh server running
   ```
4. Commit dengan [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` fitur baru
   - `fix:` perbaikan bug
   - `chore:` maintenance, docs, refactor
5. Buka Pull Request ke `main`

## Testing

| Layer | Command |
|-------|---------|
| Backend unit | `cd backend && npm test` |
| Backend coverage | `cd backend && npm run test:coverage` |
| Frontend E2E | `cd frontend && npm run e2e` (butuh dev server) |
| Health check | `npm run health-check` |

Lihat [`docs/TESTING.md`](docs/TESTING.md) untuk panduan lengkap.

## Code Style

- Backend: ESLint + Prettier (`npm run lint`, `npm run format:write`)
- Frontend: ESLint + Prettier
- Ikuti pola yang sudah ada di file sekitar perubahan Anda

## Dokumentasi

Update docs jika menambah endpoint, halaman, atau fitur:
- `docs/API_ENDPOINTS.md` — referensi API
- `docs/DIRECTORY_STRUCTURE.md` — struktur folder
- `docs/TESTING.md` — panduan testing

## Pertanyaan

Buka [GitHub Issue](https://github.com/andri5/testingndrih/issues) untuk diskusi fitur atau bug.
