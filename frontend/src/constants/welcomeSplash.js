/** Shown once after a new user completes registration (see authStore + DashboardPage). */
export const WELCOME_SPLASH_STORAGE_KEY = 'pendingWelcomeSplash'

export const welcomeSplashContent = {
  badge: 'New member',
  title: (name) => `Welcome, ${name || 'Tester'}!`,
  headline: 'Your coffee is hot. Your bugs are nervous.',
  description:
    'You just joined Test Sambil Ngopi — the chill way to automate tests without losing your sanity (or your afternoon coffee).',
  tips: [
    {
      emoji: '☕',
      title: 'Sip, then script',
      desc: 'Create a scenario or grab a template. No rush — the browser will wait.',
    },
    {
      emoji: '🎯',
      title: 'Hit Run & watch',
      desc: 'Green means glory. Red means… well, at least you found it before users did.',
    },
    {
      emoji: '🔄',
      title: 'Repeat until smug',
      desc: 'Fix, rerun, celebrate. That\'s the whole vibe.',
    },
  ],
  ctaPrimary: 'Create my first scenario',
  ctaSecondary: 'Explore dashboard',
  footnote: 'Pro tip: bugs fear testers who test while caffeinated.',
}
