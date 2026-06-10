# [1.3.0](https://github.com/andri5/testingndrih/compare/v1.2.0...v1.3.0) (2026-06-10)


### Features

* **admin:** add full user CRUD in Settings user management ([39fac7b](https://github.com/andri5/testingndrih/commit/39fac7b2ad09cf09a8545a0c714ddf1376f6ec5d))

# [1.2.0](https://github.com/andri5/testingndrih/compare/v1.1.11...v1.2.0) (2026-06-10)


### Bug Fixes

* **e2e:** align platform navigation tests with admin Tools menu ([262443c](https://github.com/andri5/testingndrih/commit/262443c658acd4b2b7fabef85a1e438dc8deba52))
* **e2e:** mock /auth/me response shape for refreshUser on load ([ed54791](https://github.com/andri5/testingndrih/commit/ed547913ca3b4f8ccbc64aef17f4dcc07fc3d7a8))


### Features

* **platform:** add user roles, admin access control, and auth improvements ([66e0840](https://github.com/andri5/testingndrih/commit/66e08403e4823fa9bfe00b323b73641a6ff4f81a))

## [1.1.11](https://github.com/andri5/testingndrih/compare/v1.1.10...v1.1.11) (2026-06-10)


### Bug Fixes

* **auth:** move Turnstile captcha from forgot-password to reset-password page ([e890a69](https://github.com/andri5/testingndrih/commit/e890a6934583877ab56ea1fd8435cf940feea0a3))

## [1.1.10](https://github.com/andri5/testingndrih/compare/v1.1.9...v1.1.10) (2026-06-10)


### Bug Fixes

* **auth:** use FRONTEND_URL from env for reset links in production ([343ff96](https://github.com/andri5/testingndrih/commit/343ff964892ef6c9cea8c293220ba8433932afbe))

## [1.1.9](https://github.com/andri5/testingndrih/compare/v1.1.8...v1.1.9) (2026-06-10)


### Bug Fixes

* **docker:** pass SMTP and FRONTEND_URL env vars to app container ([be82197](https://github.com/andri5/testingndrih/commit/be82197a3ae9360e3e00fe9107557df32b39f790))

## [1.1.8](https://github.com/andri5/testingndrih/compare/v1.1.7...v1.1.8) (2026-06-10)


### Bug Fixes

* **auth:** enhance forgot password flow with captcha and SMTP branding ([46c07b3](https://github.com/andri5/testingndrih/commit/46c07b339cd4e0e9647f400ad89afa5f68df1eaa))

## [1.1.7](https://github.com/andri5/testingndrih/compare/v1.1.6...v1.1.7) (2026-06-10)


### Bug Fixes

* **auth:** fix Turnstile ready() conflict with defer script tag ([99c4a90](https://github.com/andri5/testingndrih/commit/99c4a908100e22077e85c217ce3df27fa7e6cf0f))

## [1.1.6](https://github.com/andri5/testingndrih/compare/v1.1.5...v1.1.6) (2026-06-10)


### Bug Fixes

* **auth:** preload Turnstile script and inject site key in SPA ([d19b921](https://github.com/andri5/testingndrih/commit/d19b92112c80a121073729ec2e43c9c73919fdeb))

## [1.1.5](https://github.com/andri5/testingndrih/compare/v1.1.4...v1.1.5) (2026-06-10)


### Bug Fixes

* **auth:** load Turnstile captcha reliably on production ([e72183d](https://github.com/andri5/testingndrih/commit/e72183d30799227216ae37479d1b14190359d2b5))

## [1.1.4](https://github.com/andri5/testingndrih/compare/v1.1.3...v1.1.4) (2026-06-10)


### Bug Fixes

* **ci:** deploy via self-hosted runner on VPS ([b90ae57](https://github.com/andri5/testingndrih/commit/b90ae5721ec45c40ea36d3d66e7b6ec955011323))

## [1.1.3](https://github.com/andri5/testingndrih/compare/v1.1.2...v1.1.3) (2026-06-10)


### Bug Fixes

* **auth:** render Turnstile captcha and allow Cloudflare in CSP ([872044e](https://github.com/andri5/testingndrih/commit/872044e98f5a02d944f0167a3511b152cc86c304))

## [1.1.2](https://github.com/andri5/testingndrih/compare/v1.1.1...v1.1.2) (2026-06-10)


### Bug Fixes

* **ci:** protect production data and stabilize deploy pipeline ([caff8b3](https://github.com/andri5/testingndrih/commit/caff8b36f6eb85ffdd4807bcbe8274df9de923e4))

## [1.1.1](https://github.com/andri5/testingndrih/compare/v1.1.0...v1.1.1) (2026-06-10)


### Bug Fixes

* **ci:** trigger deploy after Release workflow completes ([65dac8d](https://github.com/andri5/testingndrih/commit/65dac8df150f3d12b51f6b13355a6f032075dc29))
* **test:** update auth controller tests for captcha and name validation ([51acfad](https://github.com/andri5/testingndrih/commit/51acfad75aadca581892181c1a28d4ca9c37e4b5))

# [1.1.0](https://github.com/andri5/testingndrih/compare/v1.0.2...v1.1.0) (2026-06-09)


### Features

* **security:** validate production secrets and add admin password rotation ([9358bb0](https://github.com/andri5/testingndrih/commit/9358bb0bde844f1c5671a83a65957fb65dfd9ba2))

## [1.0.2](https://github.com/andri5/testingndrih/compare/v1.0.1...v1.0.2) (2026-06-09)


### Bug Fixes

* **docker:** skip database seed on redeploy unless RUN_SEED=true ([9cc4165](https://github.com/andri5/testingndrih/commit/9cc4165380347280be3894ae593711b1c6e9b976))

## [1.0.1](https://github.com/andri5/testingndrih/compare/v1.0.0...v1.0.1) (2026-06-09)


### Bug Fixes

* **ci:** trigger deploy after Release workflow completes ([05f9433](https://github.com/andri5/testingndrih/commit/05f943337b375f9f4bc323be487ae7ff87ad4646))

# 1.0.0 (2026-06-09)


### Bug Fixes

* alert component backgrounds adapt to light theme ([fdd2089](https://github.com/andri5/testingndrih/commit/fdd2089486bc6e3fcb13135148bfcc7bf33cd099))
* **browserMatrixService:** Phase 1B complete - all 22 tests passing ([ad1e0c5](https://github.com/andri5/testingndrih/commit/ad1e0c598e4a33da4800cccd0ad32a92dc782d81))
* **browserMatrixService:** Phase 1B progress - improve test setup and mocks ([5e58884](https://github.com/andri5/testingndrih/commit/5e58884d163c6f468890de79394499f26fc0c7ff))
* CI/CD - fix npm install working-dirs and remove qase routes from e2e tests ([8d1fd86](https://github.com/andri5/testingndrih/commit/8d1fd860b882d7f6fc7c6d4647d1298b280bd954))
* **ci:** add package-lock and stabilize CI workflow ([2158958](https://github.com/andri5/testingndrih/commit/2158958f6b250880bd4f75c1bc9bb0b988be5d86))
* **ci:** correct production domain to testsambilngopi.com ([ee763cb](https://github.com/andri5/testingndrih/commit/ee763cb2104667db00b360686ca7005b1c109ba6))
* **ci:** install Rollup Linux native binding for E2E build ([c2198ef](https://github.com/andri5/testingndrih/commit/c2198ef0211c4e3ebf32f5da5f9d9b754759ab85))
* **ci:** run Rollup install step from repo root ([c01752e](https://github.com/andri5/testingndrih/commit/c01752e0a456af0e81a1836b42472cef8301d956))
* correct i18n implementation in ReportsPage TrendChart component ([c85492b](https://github.com/andri5/testingndrih/commit/c85492bf143205d5c9041a5a849926554938abf9))
* downgrade vite to 5.4.0 for stability and LightningCSS compatibility ([efe5645](https://github.com/andri5/testingndrih/commit/efe564550361fe1c90f1263ef44519df6d02e2b2))
* execution result cards adapt to light theme ([3ae7c85](https://github.com/andri5/testingndrih/commit/3ae7c859faac48cfe5f0213ea8ff6185b7098c7c))
* executionService.simple test - use correct API params (userId first) ([92e1b43](https://github.com/andri5/testingndrih/commit/92e1b43d891ae7052af0d71b3795033ce8cedeba))
* **executionService:** Phase 1C - remove console.error, improve async cleanup ([f35bf1e](https://github.com/andri5/testingndrih/commit/f35bf1e91ad0f8e21744f3fdb07d26e80e025e97))
* fix commitlint invalid rule name ([15dced3](https://github.com/andri5/testingndrih/commit/15dced36eeca31bc3e3616ffcaeb67676921c128))
* fix frontend error message handling for recorder API ([bb85b76](https://github.com/andri5/testingndrih/commit/bb85b765e137b3e484e8e484cace3e53d5736070))
* **frontend:** improve theme consistency, quick record auto-start, and translation ([19d8f2e](https://github.com/andri5/testingndrih/commit/19d8f2ed771700ec59d5734e3ccf527210284019))
* **i18n:** Fix language switching reactivity on Scenarios page ([c434378](https://github.com/andri5/testingndrih/commit/c4343787c7bc11bb0a0a0552bbd37d5401c24142))
* improve stress test error logging and add debug endpoint ([7aee867](https://github.com/andri5/testingndrih/commit/7aee867d9271aa1f57b4320eba21dae1cd82ccd4))
* install babel-jest and mock reportService in executionController test ([ffeb9cd](https://github.com/andri5/testingndrih/commit/ffeb9cda38f25fe5d016e0fe81b65f073335f7fd))
* **integration:** add test steps to workflow tests with correct NAVIGATE type ([16a1570](https://github.com/andri5/testingndrih/commit/16a1570b11ada876a0839f7f94897631782af955))
* **integration:** auth tests - use message field instead of error field ([8124f6b](https://github.com/andri5/testingndrih/commit/8124f6b88b345f02e336cbc5c998d37b360dbd26))
* **integration:** correct scenario response field from .id to .scenario.id ([21bba21](https://github.com/andri5/testingndrih/commit/21bba211f904963e931ab51e68a4553c4b70a3c1))
* **integration:** disable rate limiting in test environment and add cross-env ([575a2d1](https://github.com/andri5/testingndrih/commit/575a2d18514e8776cf2dcad3a1708235996fe830))
* **integration:** normalize response structure handling for scenario endpoints ([cdd7d56](https://github.com/andri5/testingndrih/commit/cdd7d567925ddbd7ab10a3eaacbcd31c92073d24))
* **parallelExecutionService:** Phase 1A stabilization - fix all 18 tests ([7992b8c](https://github.com/andri5/testingndrih/commit/7992b8c16ebadd75cf9ad87354b7aeaa097bf20d))
* **Phase 1D:** Logger implementation & console replacement ([2b23369](https://github.com/andri5/testingndrih/commit/2b2336996991059c52aa9b2b6b88b8b2e6eecea9))
* recorder steps not saved - use Playwright exposeFunction to capture steps directly ([9883858](https://github.com/andri5/testingndrih/commit/988385874454ebf9e6b9311628c734bad530bb11))
* **recorder:** open visible browser for recording and fix stepNumber race condition ([1c799c1](https://github.com/andri5/testingndrih/commit/1c799c1778a1c0287cee51887e10f9959cd68a25))
* remove e2e tests job, simplify to unit tests only ([f48e843](https://github.com/andri5/testingndrih/commit/f48e8439751ae43f2a1154f725f3bd5a3fdde2ea))
* remove npm cache (package-lock.json not in git) ([42babf3](https://github.com/andri5/testingndrih/commit/42babf3245c14226d5fa8c5ba6f68a85c8d3ec10))
* remove target specification from vite config for vite 8.0+ compatibility ([726cd81](https://github.com/andri5/testingndrih/commit/726cd81d876d7074834ba216a8b72999e0f0f698))
* resolve npm vulnerabilities and add better error handling in workflows ([00ff32c](https://github.com/andri5/testingndrih/commit/00ff32c22f959ee70dc629630c9b2161af40d99b))
* resolve theme, language, and styling bugs ([da740fc](https://github.com/andri5/testingndrih/commit/da740fc3d51d35545071b0c2dcd1351dc016b654)), closes [#1A1A1](https://github.com/andri5/testingndrih/issues/1A1A1) [#E0E0E2](https://github.com/andri5/testingndrih/issues/E0E0E2) [#2D2D2](https://github.com/andri5/testingndrih/issues/2D2D2) [#1A1A1](https://github.com/andri5/testingndrih/issues/1A1A1) [#DDDDE0](https://github.com/andri5/testingndrih/issues/DDDDE0) [#1A1A1](https://github.com/andri5/testingndrih/issues/1A1A1) [#2D2D2](https://github.com/andri5/testingndrih/issues/2D2D2) [#DDDDE0](https://github.com/andri5/testingndrih/issues/DDDDE0)
* search parameter mismatch q -> query to match backend API ([c4c066c](https://github.com/andri5/testingndrih/commit/c4c066c6f7940ba74e98e2f7cda3c8e13c04aa3f))
* search response structure mismatch - map total/hasMore to pagination object ([e52cb5c](https://github.com/andri5/testingndrih/commit/e52cb5c4cad90021973d4bf73a3feee18487330d))
* **steps:** prevent unique constraint error on step creation ([56cfc15](https://github.com/andri5/testingndrih/commit/56cfc15d9b8468e539096322cbcf5a51bd7fd20b))
* **test:** browserMatrixService - rename methods to match implementation ([c82867c](https://github.com/andri5/testingndrih/commit/c82867c58ecafd7b2202b144e20e4250ea28d0dc))
* update github actions to v4 (deprecation fix) ([8568c76](https://github.com/andri5/testingndrih/commit/8568c76a697ae1305877fbe9bfad4a86fa7ebf21))
* update github actions to v5 for Node.js 24 support ([aa0daec](https://github.com/andri5/testingndrih/commit/aa0daec4ab9ae8df56f3a46dc77e478c92ea247f))


### Features

* add 404 NotFoundPage and MaintenancePage ([5011d77](https://github.com/andri5/testingndrih/commit/5011d77fa2533893e3f8a9b9f10a376b60f04966))
* add complete i18n support to Layout and Dashboard ([5953dd2](https://github.com/andri5/testingndrih/commit/5953dd21ddf7996367b54055247167b3a9eff5f2))
* add complete i18n translations to ExecutionPage, ChainsPage, ScenariosPage, and ReportsPage ([542950e](https://github.com/andri5/testingndrih/commit/542950ee96e8b079ad5d0445764de0e718f3ce3b))
* add cross-browser testing support (Feature [#3](https://github.com/andri5/testingndrih/issues/3)) ([5b2fd36](https://github.com/andri5/testingndrih/commit/5b2fd36d5727ffdd84164f0b268e74ab80fc6386))
* add docker support for backend and frontend services ([96f339c](https://github.com/andri5/testingndrih/commit/96f339c5e87bb1a50f6b3e053807e30179f16b1c))
* add ErrorBoundary, OfflineBanner, 403 ForbiddenPage, 500 ServerErrorPage ([d07afa8](https://github.com/andri5/testingndrih/commit/d07afa88aab4b75c49decc2b5d355c9049e4ff7c))
* add node-fetch dependency for integration tests ([e2e38b3](https://github.com/andri5/testingndrih/commit/e2e38b3bdc579a14289b0ba4cf6492d8c7e0d1a1))
* add platform features and visual regression testing ([a476bbe](https://github.com/andri5/testingndrih/commit/a476bbe5eeb31568298c3aaf8140fdeab6ac1e7c))
* add profile picture upload, testing features, and reorganize project structure ([e29bb3e](https://github.com/andri5/testingndrih/commit/e29bb3ed132bdd57c6c97fe165c0a2e1f7fba9d1))
* add SessionExpiredPage and redirect 401 to /session-expired ([901e973](https://github.com/andri5/testingndrih/commit/901e973905cf75425e8e4abe9d3d1ab45f2cf6e1))
* add test analysis intelligence and loading states ([11a961b](https://github.com/andri5/testingndrih/commit/11a961b9ee80fb085cb7bcb539c18c9aba973e38))
* add test results dashboard & analytics (Feature [#1](https://github.com/andri5/testingndrih/issues/1)) ([e6bf524](https://github.com/andri5/testingndrih/commit/e6bf524a472b0bf20d7949256b39f0b5a10b6c45))
* **AnalyticsPage:** Phase 2C - add Recharts dashboard with trend, volume, failing steps, and performance charts ([c077e6a](https://github.com/andri5/testingndrih/commit/c077e6ade9284d351c2f545606e09c6bb6ea248f))
* **analytics:** Phase 2A-2B - enhance analytics service and create dashboard endpoints ([933a6c5](https://github.com/andri5/testingndrih/commit/933a6c52444d884537308f349ed82a223c0a3e9a))
* complete dev priority with tests, E2E, CI, and Swagger ([7fd3f08](https://github.com/andri5/testingndrih/commit/7fd3f0883482d3eba9d5fc5dbe69eb11be51da7a))
* enhance PDF exports with bar charts and Indonesian localization ([3a028c1](https://github.com/andri5/testingndrih/commit/3a028c126bffdc62b8ae3cc430767d093311143b))
* **excel:** Add Excel import functionality with preview modal ([ad4869a](https://github.com/andri5/testingndrih/commit/ad4869afb7ac57d3286513801ffe66dcf332f6a0))
* export SchedulerService class for testing ([0ce349a](https://github.com/andri5/testingndrih/commit/0ce349a25091c817691858991f406e353d460df8))
* **help:** add in-app usage guide modal with language toggle ([2a06bdf](https://github.com/andri5/testingndrih/commit/2a06bdfd6ec33743fe69667ae60ddce6c8d7b992))
* PDF/HTML execution report export (P3) ([4b5ebd7](https://github.com/andri5/testingndrih/commit/4b5ebd70951de6d25f2ee67c6d696670ffabae24))
* Priority 2 complete - DRAG gesture + MOCK_ROUTE network mocking ([2fdecdc](https://github.com/andri5/testingndrih/commit/2fdecdc3ee6b63601c7709d115b785d1b9087abb))
* Priority 2/3/4 - advanced step types, video recording, Swagger docs ([eef0929](https://github.com/andri5/testingndrih/commit/eef0929f84edbe07d77fc5f3f559d11f9d1b15ab))
* proxy recorder fix, headed execution with Xvfb, live viewer, cleanup ([6498efc](https://github.com/andri5/testingndrih/commit/6498efce9a3d50130ed0088c4142f251a7dc383c))
* redesign ScenariosPage stats cards - modern icon+number layout ([00f90f0](https://github.com/andri5/testingndrih/commit/00f90f0d70a483cf2f5ebf0d6421938382341b2b))
* redesign stats cards across ExecutionPage, ReportsPage, ScenarioDetailPage ([f18728e](https://github.com/andri5/testingndrih/commit/f18728ea597390b2ddeb211a7f23f71072490b28))
* scenario detail page + test step editor + per-step screenshots ([752faa4](https://github.com/andri5/testingndrih/commit/752faa4416a37309788076fd4b3772c5acc636ca))
* testing validation complete + feature gap analysis - 250 unit tests + 86 E2E tests all pass ([a1e39e3](https://github.com/andri5/testingndrih/commit/a1e39e389ab99b9d4a6d578f457e9dd220448ed6))
* **tests:** Phase 2D - add analytics service and controller test coverage ([9177762](https://github.com/andri5/testingndrih/commit/917776253244aeff6a5c5c3ba81aaa5ecf9af819))
* UI polish - responsive design, dark/light theme, auth pages redesign ([4d55ad6](https://github.com/andri5/testingndrih/commit/4d55ad6aa96982c3dce15945d45ffde3149a6506))
* **ui:** add theme-aware bilingual tooltip component ([06973e8](https://github.com/andri5/testingndrih/commit/06973e8fa73923629229ba126d099cc9b8306524))
* **ui:** Consolidate Import/Template menu and add i18n support ([796ec2d](https://github.com/andri5/testingndrih/commit/796ec2d1c0929fa3c285ddc764dd288a9db729ed))


### BREAKING CHANGES

* Version upgraded to v3.0.0 with new testing capabilities
