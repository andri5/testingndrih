export const SITE_URL = 'https://testsambilngopi.com'

export const LANDING_SEO = {
  id: {
    title: 'Test Sambil Ngopi — Platform Testing Otomatis Playwright & AI',
    description:
      'Platform test automation Indonesia: rekam & playback browser dengan Playwright, AI generate skenario, analytics, compare runs, CI/CD. Gratis mulai sekarang.',
    keywords:
      'platform testing otomatis, test automation indonesia, playwright testing, QA automation, rekam test browser, end to end testing, automated testing, smoke test, visual regression, test sambil ngopi',
    locale: 'id_ID',
    path: '/id',
  },
  en: {
    title: 'Test Sambil Ngopi — Playwright Test Automation & AI Platform',
    description:
      'Record & playback browser tests with Playwright, AI scenario generator, analytics, run diff, and CI integration. Free to start — self-hosted ready.',
    keywords:
      'automated testing platform, playwright test automation, record and playback testing, end to end testing, QA automation tool, browser testing, smoke test, visual regression, CI test automation',
    locale: 'en_US',
    path: '/',
  },
}

export const ABOUT_SEO = {
  id: {
    title: 'Tentang Kami — Test Sambil Ngopi',
    description:
      'Kenali Test Sambil Ngopi: platform test automation berbasis Playwright & AI untuk tim QA dan developer Indonesia. Self-hosted, rekam & playback, CI-ready.',
    keywords:
      'tentang test sambil ngopi, platform QA indonesia, test automation, playwright, about us',
    locale: 'id_ID',
    path: '/id/about',
  },
  en: {
    title: 'About — Test Sambil Ngopi',
    description:
      'Learn about Test Sambil Ngopi: a Playwright & AI test automation platform for QA teams and developers. Self-hosted, record & playback, CI-ready.',
    keywords:
      'about test sambil ngopi, QA platform, test automation, playwright, about us',
    locale: 'en_US',
    path: '/about',
  },
}

export const landingCopy = {
  id: {
    navFeatures: 'Fitur',
    navHow: 'Cara Kerja',
    navFeedback: 'Saran',
    navAbout: 'Tentang',
    navLogin: 'Login',
    navCta: 'Mulai Gratis',
    footerTagline: 'Platform test automation Playwright & AI — ngopi dulu, yakin kemudian.',
    footerProduct: 'Produk',
    footerAccount: 'Akun',
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
    feedbackBadge: 'Bantu kami berkembang',
    feedbackTitle: 'Saran & masukan Anda',
    feedbackSubtitle:
      'Punya ide fitur, perbaikan UI, atau pengalaman pakai platform? Kirim saran — kami baca setiap masukan.',
    feedbackName: 'Nama (opsional)',
    feedbackNamePlaceholder: 'Nama Anda',
    feedbackEmail: 'Email (opsional)',
    feedbackEmailPlaceholder: 'email@contoh.com',
    feedbackMessage: 'Saran atau masukan',
    feedbackMessagePlaceholder: 'Ceritakan apa yang bisa kami perbaiki atau tambahkan...',
    feedbackSubmit: 'Kirim Saran',
    feedbackSending: 'Mengirim...',
    feedbackError: 'Gagal mengirim. Coba lagi nanti.',
    feedbackThanksTitle: 'Terima kasih!',
    feedbackThanksText: 'Masukan Anda sudah kami terima. Tim akan meninjaunya untuk penyempurnaan platform.',
    feedbackSendAnother: 'Kirim saran lain',
    footerProduction: 'Production',
    mockupTitle: 'Login Flow — Staging',
    notFoundTitle: 'Halaman tidak ditemukan',
    notFoundDesc: 'URL yang Anda buka tidak ada atau sudah dipindahkan. Cek kembali alamatnya atau kembali ke beranda.',
    notFoundBack: 'Kembali ke Beranda',
    notFoundGoBack: 'Halaman sebelumnya',
    notFoundLogin: 'Login',
    notFoundRegister: 'Mulai Gratis',
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
    navFeedback: 'Feedback',
    navAbout: 'About',
    navLogin: 'Login',
    navCta: 'Start Free',
    footerTagline: 'Playwright test automation with AI — sip coffee, ship with confidence.',
    footerProduct: 'Product',
    footerAccount: 'Account',
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
    feedbackBadge: 'Help us improve',
    feedbackTitle: 'Your feedback & suggestions',
    feedbackSubtitle:
      'Have ideas for features, UI improvements, or your experience using the platform? We read every message.',
    feedbackName: 'Name (optional)',
    feedbackNamePlaceholder: 'Your name',
    feedbackEmail: 'Email (optional)',
    feedbackEmailPlaceholder: 'you@example.com',
    feedbackMessage: 'Suggestion or feedback',
    feedbackMessagePlaceholder: 'Tell us what we can improve or add...',
    feedbackSubmit: 'Send Feedback',
    feedbackSending: 'Sending...',
    feedbackError: 'Failed to send. Please try again later.',
    feedbackThanksTitle: 'Thank you!',
    feedbackThanksText: 'We received your feedback. Our team will review it to improve the platform.',
    feedbackSendAnother: 'Send another',
    footerProduction: 'Live Site',
    mockupTitle: 'Login Flow — Staging',
    notFoundTitle: 'Page not found',
    notFoundDesc: "The page you're looking for doesn't exist or has been moved. Check the URL or head back home.",
    notFoundBack: 'Back to Home',
    notFoundGoBack: 'Previous page',
    notFoundLogin: 'Login',
    notFoundRegister: 'Start Free',
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

export const aboutCopy = {
  id: {
    badge: 'Tentang platform',
    title: 'Test Sambil Ngopi',
    subtitle:
      'Platform test automation yang dirancang supaya tim QA dan developer bisa fokus ke kualitas produk — tanpa ribet setup alat yang terpisah-pisah.',
    missionTitle: 'Misi kami',
    missionText:
      'Menyediakan workspace testing otomatis yang praktis, terjangkau, dan ramah untuk tim di Indonesia: rekam skenario browser, jalankan dengan Playwright, analisis hasil, dan integrasikan ke CI — semua dalam satu tempat.',
    forWhoTitle: 'Untuk siapa?',
    forWho: [
      {
        title: 'QA & Tester',
        desc: 'Bangun regression suite, smoke test, dan visual check tanpa menulis kode panjang. Tag, favorit, dan compare runs memudahkan triase.',
      },
      {
        title: 'Developer',
        desc: 'Self-hosted ready, API token untuk pipeline, environments per stage, dan AI assistant saat locator atau step gagal.',
      },
      {
        title: 'Tim kecil & indie',
        desc: 'Gratis mulai, tanpa kartu kredit. Cocok untuk side project, startup, atau internal tool sebelum scale ke enterprise.',
      },
    ],
    builtTitle: 'Dibangun dengan',
    builtItems: ['Playwright', 'Node.js & Express', 'React', 'PostgreSQL', 'Docker', 'GitHub Actions CI/CD', 'AI (Groq/OpenAI-compatible)'],
    valuesTitle: 'Prinsip kami',
    values: [
      'Playwright di core — bukan wrapper tipis, engine execution yang reliable.',
      'AI sebagai asisten, bukan pengganti: generate skenario, explain failure, suggest locator.',
      'Transparan & self-hosted: deploy di VPS sendiri, data test tetap milik Anda.',
      'Bahasa Indonesia & English — landing dan docs ramah untuk tim lokal dan global.',
    ],
    liveTitle: 'Production',
    liveText: 'Platform live di testsambilngopi.com — open source workflow dengan deploy otomatis via GitHub Actions.',
    ctaTitle: 'Mau coba sendiri?',
    ctaText: 'Buat akun gratis dan rekam skenario pertama hari ini.',
    ctaButton: 'Mulai Gratis',
  },
  en: {
    badge: 'About the platform',
    title: 'Test Sambil Ngopi',
    subtitle:
      'A test automation platform built so QA teams and developers can focus on product quality — without juggling disconnected tools.',
    missionTitle: 'Our mission',
    missionText:
      'Provide a practical, affordable testing workspace: record browser scenarios, run them with Playwright, analyze results, and plug into CI — all in one place.',
    forWhoTitle: 'Who is it for?',
    forWho: [
      {
        title: 'QA & Testers',
        desc: 'Build regression suites, smoke tests, and visual checks without long scripts. Tags, favorites, and run diff simplify triage.',
      },
      {
        title: 'Developers',
        desc: 'Self-hosted ready, API tokens for pipelines, per-stage environments, and AI help when locators or steps fail.',
      },
      {
        title: 'Small & indie teams',
        desc: 'Free to start, no credit card. Great for side projects, startups, or internal tools before scaling up.',
      },
    ],
    builtTitle: 'Built with',
    builtItems: ['Playwright', 'Node.js & Express', 'React', 'PostgreSQL', 'Docker', 'GitHub Actions CI/CD', 'AI (Groq/OpenAI-compatible)'],
    valuesTitle: 'What we believe',
    values: [
      'Playwright at the core — a reliable execution engine, not a thin wrapper.',
      'AI as assistant, not replacement: generate scenarios, explain failures, suggest locators.',
      'Transparent & self-hosted: deploy on your VPS, your test data stays yours.',
      'Indonesian & English — landing and UX friendly for local and global teams.',
    ],
    liveTitle: 'Production',
    liveText: 'Live at testsambilngopi.com — open-source workflow with automated deploy via GitHub Actions.',
    ctaTitle: 'Want to try it?',
    ctaText: 'Create a free account and record your first scenario today.',
    ctaButton: 'Start Free',
  },
}
