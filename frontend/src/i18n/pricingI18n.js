export const PRICING_SEO = {
  id: {
    title: 'Harga — Test Sambil Ngopi',
    description:
      'Paket Free, Team, dan Self-hosted untuk test automation Playwright. Mulai gratis tanpa kartu kredit.',
    keywords: 'harga test automation, pricing playwright, test sambil ngopi',
    locale: 'id_ID',
    path: '/id/pricing',
  },
  en: {
    title: 'Pricing — Test Sambil Ngopi',
    description:
      'Free, Team, and Self-hosted plans for Playwright test automation. Start free — no credit card.',
    keywords: 'test automation pricing, playwright saas pricing, test sambil ngopi',
    locale: 'en_US',
    path: '/pricing',
  },
}

export const pricingCopy = {
  id: {
    seoTitle: 'Harga — Test Sambil Ngopi',
    seoDescription:
      'Paket Free, Team, dan Self-hosted untuk test automation Playwright. Mulai gratis tanpa kartu kredit.',
    title: 'Harga sederhana',
    subtitle:
      'Mulai gratis untuk individu. Scale ke tim atau self-hosted runner untuk staging internal.',
    footnote:
      'Run cloud hanya untuk URL publik. Staging internal: backend lokal atau local agent (lihat docs/RUN_INTERNAL.md).',
    plans: [
      {
        name: 'Free',
        price: 'Rp0',
        period: '/selamanya',
        desc: 'Cocok untuk belajar dan skenario publik.',
        badge: 'Paling populer',
        highlight: true,
        cta: 'Mulai gratis',
        ctaTo: '/register',
        features: [
          'Scenario, Record, Run (URL publik)',
          'Environments & reports',
          'Kuota AI harian',
          'Local agent untuk staging internal',
        ],
      },
      {
        name: 'Team',
        price: 'Soon',
        period: '',
        desc: 'Kolaborasi, share run link, dan kuota lebih besar.',
        highlight: false,
        cta: 'Hubungi kami',
        ctaTo: '/id#saran',
        features: [
          'Semua di Free',
          'Seat & role management',
          'Shareable run links',
          'Prioritas support',
        ],
      },
      {
        name: 'Self-hosted',
        price: 'Open',
        period: '',
        desc: 'Deploy di VPS/LAN Anda — ideal runner on-prem.',
        highlight: false,
        cta: 'Lihat GitHub',
        ctaTo: 'https://github.com/andri5/testingndrih',
        features: [
          'Kode terbuka (MIT)',
          'ALLOW_PRIVATE_NETWORK_EXECUTION',
          'CI/CD & Telegram deploy hooks',
          'Kontrol penuh data',
        ],
      },
    ],
  },
  en: {
    seoTitle: 'Pricing — Test Sambil Ngopi',
    seoDescription:
      'Free, Team, and Self-hosted plans for Playwright test automation. Start free — no credit card.',
    title: 'Simple pricing',
    subtitle:
      'Start free as an individual. Scale to a team or self-host a runner for internal staging.',
    footnote:
      'Cloud Run is for public URLs only. Internal staging: local backend or local agent (see docs/RUN_INTERNAL.md).',
    plans: [
      {
        name: 'Free',
        price: '$0',
        period: '/forever',
        desc: 'Great for learning and public scenarios.',
        badge: 'Most popular',
        highlight: true,
        cta: 'Start free',
        ctaTo: '/register',
        features: [
          'Scenarios, Record, Run (public URLs)',
          'Environments & reports',
          'Daily AI quota',
          'Local agent for internal staging',
        ],
      },
      {
        name: 'Team',
        price: 'Soon',
        period: '',
        desc: 'Collaboration, shareable runs, higher quotas.',
        highlight: false,
        cta: 'Contact us',
        ctaTo: '/#saran',
        features: [
          'Everything in Free',
          'Seats & roles',
          'Shareable run links',
          'Priority support',
        ],
      },
      {
        name: 'Self-hosted',
        price: 'Open',
        period: '',
        desc: 'Deploy on your VPS/LAN — ideal on-prem runner.',
        highlight: false,
        cta: 'View GitHub',
        ctaTo: 'https://github.com/andri5/testingndrih',
        features: [
          'Open source (MIT)',
          'ALLOW_PRIVATE_NETWORK_EXECUTION',
          'CI/CD & Telegram deploy hooks',
          'Full data control',
        ],
      },
    ],
  },
}
