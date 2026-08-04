/** Shown once after a new user completes registration (see authStore + DashboardPage). */
export const WELCOME_SPLASH_STORAGE_KEY = 'pendingWelcomeSplash'

export const ONBOARDING_CHECKLIST_KEY = 'onboardingChecklistV1'

export const defaultOnboardingChecklist = () => ({
  createScenario: false,
  addOrRecordSteps: false,
  runPublicOrLocal: false,
  dismissed: false,
})

export const welcomeSplashContent = {
  badge: 'New member',
  title: (name) => `Welcome, ${name || 'Tester'}!`,
  headline: 'Your coffee is hot. Your bugs are nervous.',
  description:
    'You just joined Test Sambil Ngopi — automate tests without losing your afternoon coffee.',
  tips: [
    {
      emoji: '1',
      title: 'Create a scenario',
      desc: 'Use Create Manual, Templates, or Import Excel (Quick Record is admin-only).',
    },
    {
      emoji: '2',
      title: 'Add steps or Record',
      desc: 'Open the scenario → Add Step or Record on the real site (client-direct).',
    },
    {
      emoji: '3',
      title: 'Run the right way',
      desc: 'Public URLs: Run in the cloud. Internal/VPN staging: local backend or Queue local agent.',
    },
  ],
  ctaPrimary: 'Create my first scenario',
  ctaSecondary: 'Explore dashboard',
  footnote: 'Tip: internal staging cannot Run from a public VPS — see docs/RUN_INTERNAL.md.',
}
