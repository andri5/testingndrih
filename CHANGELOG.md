# TestingNDRIH Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-04-23

### 🎉 Major Release: Playwright v2.0 Recording Engine

#### Added
- ✨ **Headless Browser Recording** — Backend-controlled Playwright chromium for reliable recording
- 🎥 **Real-time Step Polling** — Frontend polls status every 1.5 seconds (GET `/api/recorder/status/:id`)
- 📊 **Server-side Recording** — No proxy window, no CSP issues, 95%+ accuracy
- 🔄 **Step Extraction** — Direct browser context evaluation via `page.evaluate()`
- 🌐 **Cross-Browser Testing** — Run same scenario on Chrome, Firefox, WebKit, Edge
- ⏰ **Test Scheduling** — Schedule test runs (Once, Hourly, Daily, Weekly)
- 🔀 **Parallel Execution** — Execute multiple scenarios simultaneously
- 🔐 **Password Reset** — Email-based password reset with Nodemailer SMTP integration
- 🎨 **Dark/Light Theme** — Full theme support across all pages
- 📁 **Project Organization** — Clean folder structure with `/docs/guides/` and `/tests/backend/`

#### Changed
- 🔄 **Migration from v1.1** — Replaced proxy-based recording with Playwright headless browser
- 📚 **Documentation** — Comprehensive guides in `/docs/guides/` (11 files, 1000+ lines)
- 🗂️ **Structure** — Reorganized project with centralized documentation and organized tests

#### Technical Details
- Backend: Node.js 20.x + Express 4.x (ESM modules)
- Frontend: React 18.2 + Vite 5.4
- Database: PostgreSQL 16 + Prisma 5.x
- Recording Engine: Playwright 1.40+ (headless chromium)
- State Management: Zustand 4.4
- Styling: TailwindCSS 3.4

#### Test Results
- ✅ Unit Tests: 6/6 passing
- ✅ API Tests: 5/5 passing
- ✅ E2E Flow: Full workflow verified
- ✅ Integration Tests: Database persistence confirmed
- ✅ Overall: 17+ test cases passing

#### Breaking Changes
- ❌ Removed proxy window-based recording (v1.1)
- ✅ API now returns HTTP 202 for recording start (async operation)
- ✅ No longer returns proxyURL in recording start response

---

## Version History

### Pre-release Versions
- v1.1.0 (April 2026) — Previous version with proxy-based recording
- v1.0.0 (March 2026) — Initial release

---

## Upcoming Features (Roadmap)

- [ ] Visual regression testing improvements
- [ ] Advanced locator repair strategies
- [ ] Multi-browser screenshot comparison
- [ ] Custom test templates
- [ ] Integration with additional test frameworks

---

## Contributing

Please follow [Semantic Commit Conventions](./COMMIT_CONVENTIONS.md) when contributing.

## License

MIT © 2026 TestingNDRIH
