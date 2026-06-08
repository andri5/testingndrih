# API Endpoints Reference

**Base URL (dev):** `http://localhost:5001/api`  
**Auth:** `Authorization: Bearer <JWT>` (kecuali auth & CI health)  
**Swagger UI:** `http://localhost:5001/api/docs`

**Last Updated:** June 4, 2026

---

## Auth — `/api/auth`

| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | `/register` | Daftar user baru |
| POST | `/login` | Login, dapatkan JWT |
| GET | `/me` | Profil user saat ini |
| POST | `/forgot-password` | Kirim email reset password |
| GET | `/validate-reset-token/:token` | Validasi token reset |
| POST | `/reset-password/:token` | Set password baru |

---

## Scenarios — `/api/scenarios`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/` | List skenario user |
| POST | `/` | Buat skenario |
| GET | `/:id` | Detail skenario + steps |
| PUT | `/:id` | Update skenario |
| DELETE | `/:id` | Hapus skenario |

---

## Test Steps — `/api/scenarios/:scenarioId/steps`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/` | List steps |
| POST | `/` | Tambah step |
| GET | `/:stepId` | Detail step |
| PUT | `/:stepId` | Update step |
| DELETE | `/:stepId` | Hapus step |
| PUT | `/reorder` | Reorder steps |
| POST | `/bulk-delete` | Hapus banyak steps |
| PUT | `/batch-update` | Update batch |

---

## Execution — `/api/executions`

| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | `/` | Jalankan skenario |
| GET | `/` | History eksekusi |
| GET | `/:id` | Detail eksekusi |
| GET | `/:id/stream` | SSE stream status |
| DELETE | `/:id` | Hapus eksekusi |

---

## Recorder — `/api/recorder`

| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | `/start` | Mulai recording |
| POST | `/stop` | Stop recording |
| GET | `/status/:scenarioId` | Status recording |
| POST | `/save/:scenarioId` | Simpan steps |
| POST | `/step/:scenarioId` | Terima step dari browser |
| GET | `/proxy` | Proxy page (recording) |
| GET | `/asset` | Proxy asset |

---

## API Testing — `/api/api-tests`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/scenarios/:scenarioId` | List API tests per skenario |
| POST | `/scenarios/:scenarioId` | Buat API test |
| PUT | `/:apiTestId` | Update API test |
| DELETE | `/:apiTestId` | Hapus API test |
| POST | `/:apiTestId/run` | Jalankan API test |
| GET | `/:apiTestId/results` | Riwayat hasil |

---

## Issues — `/api/issues`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/` | List issues (`?status=OPEN`) |
| GET | `/:issueId` | Detail issue |
| PATCH | `/:issueId` | Update status/severity |

> Issue dibuat otomatis saat eksekusi gagal.

---

## Environments — `/api/environments`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/` | List environment |
| POST | `/` | Buat environment |
| PUT | `/:environmentId` | Update environment |
| DELETE | `/:environmentId` | Hapus environment |
| GET | `/:environmentId/variables` | List variabel |
| GET | `/:environmentId/resolved` | Map variabel (secret masked) |
| POST | `/:environmentId/variables` | Upsert variabel |
| DELETE | `/:environmentId/variables/:variableId` | Hapus variabel |

**Substitusi:** gunakan `{{variableName}}` di step URL, selector, value, dan API test body.

---

## Visual Regression — `/api/visual-regression`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/baselines` | List baseline (`?scenarioId=`) |
| GET | `/comparisons` | List perbandingan |
| POST | `/capture/:scenarioId` | Capture baseline |
| POST | `/run/:scenarioId` | Jalankan visual test |
| POST | `/comparisons/:comparisonId/approve` | Approve sebagai baseline baru |
| DELETE | `/baselines/:baselineId` | Hapus baseline |

**Static files:** `/api/visual/*`

---

## Analytics — `/api/analytics`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/summary` | Ringkasan analytics |
| GET | `/executions` | History eksekusi |
| GET | `/scenarios/:scenarioId` | Metrik per skenario |
| GET | `/dashboard/trends` | Pass/fail trend |
| GET | `/dashboard/failing-steps` | Top failing steps |
| GET | `/dashboard/volume` | Volume eksekusi |
| GET | `/dashboard/scenario-performance` | Performa skenario |
| GET | `/dashboard/flaky-steps` | Flaky steps |
| GET | `/export` | Export data analytics |

---

## Chains — `/api/chains`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/` | List chain |
| POST | `/` | Buat chain |
| GET | `/:id` | Detail chain |
| PUT | `/:id` | Update chain |
| DELETE | `/:id` | Hapus chain |
| POST | `/:id/execute` | Jalankan chain |

---

## Scheduler — `/api/scheduler`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/` | List jadwal |
| POST | `/` | Buat jadwal |
| GET | `/:scheduleId` | Detail jadwal |
| PUT | `/:scheduleId` | Update jadwal |
| DELETE | `/:scheduleId` | Hapus jadwal |
| POST | `/:scheduleId/test` | Test run manual |
| GET | `/:scheduleId/history` | Riwayat jadwal |

---

## Parallel Execution — `/api/parallel`

| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | `/execute` | Jalankan batch paralel |
| GET | `/batch/:batchId` | Status batch |
| POST | `/batch/:batchId/cancel` | Batalkan batch |
| GET | `/queue` | Antrian aktif |
| GET | `/batches` | List batch |

---

## Browser Matrix — `/api/browser-matrix`

| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | `/execute` | Jalankan cross-browser |
| GET | `/executions` | List matrix execution |
| GET | `/scenario/:scenarioId/report` | Laporan per skenario |
| GET | `/:matrixId` | Detail matrix |

---

## Smoke / Stress / Security

| Prefix | Contoh endpoint |
|--------|-----------------|
| `/api/smoke` | `POST /`, `GET /summary`, `GET /history/:scenarioId` |
| `/api/stress` | `POST /`, `GET /summary`, `POST /mark/:scenarioId` |
| `/api/security` | `POST /scan`, `GET /scans`, `GET /scans/:scanId/findings` |

---

## Notifications — `/api/notifications`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/settings` | Pengaturan notifikasi user |
| PUT | `/settings` | Update email/webhook |

---

## API Tokens (CI/CD) — `/api/tokens`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/` | List token |
| POST | `/` | Buat token |
| DELETE | `/:tokenId` | Revoke token |

---

## CI — `/api/ci`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/health` | Health check (tanpa auth) |
| POST | `/run/:scenarioId` | Jalankan skenario via API token |

**Header:** `X-API-Token: <token>`

Contoh workflow: `.github/workflows/ci-run-scenario.example.yml`

---

## Import — `/api/import`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/template` | Download template Excel |
| POST | `/preview` | Preview import |
| POST | `/confirm` | Konfirmasi import |

---

## Search — `/api/search`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/` | Cari skenario |
| GET | `/by-date` | Filter by date |
| GET | `/recent` | Skenario terbaru |
| GET | `/most-executed` | Paling sering dijalankan |
| GET | `/filter` | Filter lanjutan |

---

## Files — `/api/files`

| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | `/upload` | Upload file |
| GET | `/download/:filename` | Download file |
| GET | `/` | List files |
| GET | `/templates` | List template |
| POST | `/templates` | Buat template |

---

## Health

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/health` | Server health (root, bukan `/api`) |

---

## Environment Variables (Backend)

| Variable | Fungsi |
|----------|--------|
| `DATABASE_URL` | Koneksi PostgreSQL |
| `JWT_SECRET` | Signing JWT |
| `ENCRYPTION_KEY` | Enkripsi secret env vars |
| `SMTP_*` | Email (reset password, notifikasi) |
| `CORS_ORIGIN` | Origin frontend |
| `BROWSER_HEADLESS` | Mode Playwright |

Lihat `.env.example` untuk daftar lengkap.
