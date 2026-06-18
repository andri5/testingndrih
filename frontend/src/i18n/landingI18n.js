export const SITE_URL = 'https://testsambilngopi.com'

export const LANDING_SEO = {
  id: {
    title: 'Test Sambil Ngopi — Platform Testing Otomatis Playwright & AI',
    description:
      'Platform test automation Indonesia: rekam & playback browser dengan Playwright, AI generate skenario, analytics, compare runs, CI/CD. Gratis mulai sekarang.',
    keywords:
      'platform testing otomatis, test automation indonesia, playwright testing, QA automation, rekam test browser, end to end testing, automated testing, smoke test, visual regression, test sambil ngopi',
    locale: 'id_ID',
    path: '/',
  },
  en: {
    title: 'Test Sambil Ngopi — Playwright Test Automation & AI Platform',
    description:
      'Record & playback browser tests with Playwright, AI scenario generator, analytics, run diff, and CI integration. Free to start — self-hosted ready.',
    keywords:
      'automated testing platform, playwright test automation, record and playback testing, end to end testing, QA automation tool, browser testing, smoke test, visual regression, CI test automation',
    locale: 'en_US',
    path: '/en',
  },
}

export const landingCopy = {
  id: {
    navFeatures: 'Fitur',
    navHow: 'Cara Kerja',
    navLogin: 'Login',
    navCta: 'Mulai Gratis',
    badge: 'Playwright · AI · CI-ready',
    heroTitle: 'Platform testing yang',
    heroHighlight: 'ngopi dulu, yakin kemudian',
    heroSubtitle:
      'Rekam, bangun, dan jalankan skenario otomatis. Dari quick record sampai AI generate, analytics, compare runs — semua dalam satu workspace.',
    ctaPrimary: 'Mulai Gratis',
    ctaSecondary: 'Sign In',
    trust1: 'Tanpa kartu kredit',
    trust2: 'Chromium · Firefox · WebKit',
    trust3: 'Siap self-hosted',
    featuresTitle: 'Semua yang tim QA butuhkan',
    featuresSubtitle:
      'Dari skenario sederhana sampai regression suite — fitur dirancang untuk developer dan tester.',
    howTitle: 'Cara kerja',
    aiBadge: 'AI-Powered',
    aiTitle: 'Testing lebih cepat dengan AI',
    aiSubtitle:
      'Generate skenario dari bahasa natural, dapatkan penjelasan saat step gagal, dan saran locator cerdas — tanpa mengganti engine Playwright yang sudah reliable.',
    aiItems: ['AI Scenario Generator', 'AI Failure Explainer', 'AI Locator Assistant'],
    aiPrompt: 'Login dengan kredensial valid, pastikan dashboard muncul',
    aiGenerated: '→ Generated 6 steps',
    advancedTitle: 'Advanced tools untuk power user',
    advancedSubtitle: 'Admin workspace: chains, scheduler, parallel runs, dan specialized testing.',
    ctaFinalTitle: 'Siap mengotomatisasi testing Anda?',
    ctaFinalSubtitle: 'Buat akun gratis dan mulai rekam skenario pertama dalam hitungan menit.',
    ctaFinalButton: 'Buat Akun Gratis',
    footerProduction: 'Production',
    mockupTitle: 'Login Flow — Staging',
    features: [
      { title: 'Record & Playback', desc: 'Rekam interaksi browser dengan Playwright, otomatis jadi test steps yang bisa dijalankan ulang.' },
      { title: 'Scenario Management', desc: 'Buat, edit, clone, import Excel, template siap pakai, tag, dan favorit untuk organisasi test.' },
      { title: 'Execution Engine', desc: 'Jalankan scenario step-by-step dengan screenshot, retry, self-healing selector, dan run diff.' },
      { title: 'AI Assistant', desc: 'Generate scenario dari deskripsi, analisis kegagalan, dan saran locator — dengan kuota harian yang adil.' },
      { title: 'Environments', desc: 'Kelola variabel per environment (dev/staging/prod) dengan substitusi {{var}} di steps.' },
      { title: 'Analytics & Reports', desc: 'Trend eksekusi, flaky steps, export HTML/PDF, dan insight performa test.' },
      { title: 'Compare Runs', desc: 'Bandingkan dua eksekusi side-by-side — lihat step mana yang berubah status atau error.' },
      { title: 'CI & Notifications', desc: 'API token untuk pipeline, webhook & email saat test gagal, smoke test deploy gate.' },
    ],
    steps: [
      { title: 'Record atau buat', text: 'Quick Record, template, AI Generate, atau form manual.' },
      { title: 'Atur steps', text: 'Edit selector, tambah assertion, set environment variables.' },
      { title: 'Jalankan', text: 'Run di Chromium/Firefox/WebKit — headless atau headed.' },
      { title: 'Analisis', text: 'Lihat report, compare runs, perbaiki dengan AI & smart suggestions.' },
    ],
  },
  en: {
    navFeatures: 'Features',
    navHow: 'How It Works',
    navLogin: 'Login',
    navCta: 'Start Free',
    badge: 'Playwright · AI · CI-ready',
    heroTitle: 'Test automation that lets you',
    heroHighlight: 'sip coffee, ship with confidence',
    heroSubtitle:
      'Record, build, and run automated scenarios. From quick record to AI generation, analytics, and run diff — all in one workspace.',
    ctaPrimary: 'Start Free',
    ctaSecondary: 'Sign In',
    trust1: 'No credit card',
    trust2: 'Chromium · Firefox · WebKit',
    trust3: 'Self-hosted ready',
    featuresTitle: 'Everything your QA team needs',
    featuresSubtitle:
      'From simple flows to full regression suites — built for developers and testers.',
    howTitle: 'How it works',
    aiBadge: 'AI-Powered',
    aiTitle: 'Faster testing with AI',
    aiSubtitle:
      'Generate scenarios from plain language, explain failures, and get smart locator suggestions — powered by Playwright under the hood.',
    aiItems: ['AI Scenario Generator', 'AI Failure Explainer', 'AI Locator Assistant'],
    aiPrompt: 'Login with valid credentials and verify the dashboard appears',
    aiGenerated: '→ Generated 6 steps',
    advancedTitle: 'Advanced tools for power users',
    advancedSubtitle: 'Admin workspace: chains, scheduler, parallel runs, and specialized testing.',
    ctaFinalTitle: 'Ready to automate your testing?',
    ctaFinalSubtitle: 'Create a free account and record your first scenario in minutes.',
    ctaFinalButton: 'Create Free Account',
    footerProduction: 'Live Site',
    mockupTitle: 'Login Flow — Staging',
    features: [
      { title: 'Record & Playback', desc: 'Record browser interactions with Playwright and replay them as reusable test steps.' },
      { title: 'Scenario Management', desc: 'Create, edit, clone, Excel import, templates, tags, and favorites to organize tests.' },
      { title: 'Execution Engine', desc: 'Run scenarios step-by-step with screenshots, retries, self-healing selectors, and run diff.' },
      { title: 'AI Assistant', desc: 'Generate scenarios from descriptions, explain failures, and suggest locators with fair daily quotas.' },
      { title: 'Environments', desc: 'Manage variables per environment (dev/staging/prod) with {{var}} substitution in steps.' },
      { title: 'Analytics & Reports', desc: 'Execution trends, flaky step detection, HTML/PDF export, and performance insights.' },
      { title: 'Compare Runs', desc: 'Side-by-side comparison of two executions — see which steps changed status or errors.' },
      { title: 'CI & Notifications', desc: 'API tokens for pipelines, webhooks & email on failure, smoke test deploy gates.' },
    ],
    steps: [
      { title: 'Record or create', text: 'Quick Record, templates, AI Generate, or manual form.' },
      { title: 'Configure steps', text: 'Edit selectors, add assertions, set environment variables.' },
      { title: 'Execute', text: 'Run on Chromium/Firefox/WebKit — headless or headed.' },
      { title: 'Analyze', text: 'View reports, compare runs, fix with AI & smart suggestions.' },
    ],
  },
}

export const ADVANCED_LABELS = [
  'Test Chains',
  'Scheduler',
  'Browser Matrix',
  'Smoke Test',
  'Stress Test',
  'Security Test',
  'Visual Regression',
  'API Testing',
]
