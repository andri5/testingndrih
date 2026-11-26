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
      title: 'Create a case',
      desc: 'Click New case → Blank, Template, Import, or Quick Record.',
    },
    {
      emoji: '2',
      title: 'Edit steps in the panel',
      desc: 'Click a case in the list → edit meta & steps in the right panel. Open full page to run.',
    },
    {
      emoji: '3',
      title: 'Run the right way',
      desc: 'Manual checklist or automated run on the case page. Use Test Runs for multi-case cycles.',
    },
    {
      emoji: '4',
      title: 'Find your way around',
      desc: 'Expand the left sidebar for labels. How to use is always in the help icon.',
    },
  ],
  ctaPrimary: 'Create my first case',
  ctaSecondary: 'Explore dashboard',
  footnote: 'Tip: internal staging cannot Run from a public VPS — see docs/RUN_INTERNAL.md.',
}
