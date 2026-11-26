import {
  Plus,
  ListChecks,
  Bug,
  Layers,
  Clock,
  Activity,
  Gauge,
  Shield,
  Globe,
  GitBranch,
} from 'lucide-react'
import { resolveUserMenuPaths } from './menuPermissions'

/**
 * Dashboard quick actions — Manual QA first; Tools only when menu allows.
 */
export const QUICK_ACTIONS = [
  {
    id: 'create-scenario',
    titleKey: 'createScenario',
    descKey: 'startRecording',
    path: '/scenarios',
    icon: Plus,
    iconBg: 'bg-[#0F766E]/10',
    iconColor: 'text-[#0F766E]',
    priority: 1,
  },
  {
    id: 'test-runs',
    titleKey: 'testRuns',
    descKey: 'testRunsDesc',
    path: '/test-runs',
    icon: ListChecks,
    iconBg: 'bg-[#0F766E]/10',
    iconColor: 'text-[#0F766E]',
    priority: 2,
  },
  {
    id: 'issues',
    titleKey: 'bugs',
    descKey: 'bugsDesc',
    path: '/issues',
    icon: Bug,
    iconBg: 'bg-[#FBBF24]/10',
    iconColor: 'text-[#FBBF24]',
    priority: 3,
  },
  {
    id: 'environments',
    titleKey: 'environments',
    descKey: 'environmentsDesc',
    path: '/environments',
    icon: Layers,
    iconBg: 'bg-[#0F766E]/10',
    iconColor: 'text-[#0F766E]',
    priority: 4,
  },
  {
    id: 'scheduler',
    titleKey: 'scheduler',
    descKey: 'schedulerDesc',
    path: '/scheduler',
    icon: Clock,
    iconBg: 'bg-[#0F766E]/10',
    iconColor: 'text-[#0F766E]',
    priority: 10,
  },
  {
    id: 'parallel',
    titleKey: 'parallel',
    descKey: 'parallelDesc',
    path: '/parallel',
    icon: GitBranch,
    iconBg: 'bg-[#34D399]/10',
    iconColor: 'text-[#34D399]',
    priority: 10,
  },
  {
    id: 'smoke-test',
    titleKey: 'smokeTest',
    descKey: 'smokeTestDesc',
    path: '/smoke-test',
    icon: Activity,
    iconBg: 'bg-[#4EC9B0]/10',
    iconColor: 'text-[#4EC9B0]',
    priority: 10,
  },
  {
    id: 'stress-test',
    titleKey: 'stressTest',
    descKey: 'stressTestDesc',
    path: '/stress-test',
    icon: Gauge,
    iconBg: 'bg-[#F87171]/10',
    iconColor: 'text-[#F87171]',
    priority: 10,
  },
  {
    id: 'security-test',
    titleKey: 'securityTest',
    descKey: 'securityTestDesc',
    path: '/security-test',
    icon: Shield,
    iconBg: 'bg-[#FBBF24]/10',
    iconColor: 'text-[#FBBF24]',
    priority: 10,
  },
  {
    id: 'api-testing',
    titleKey: 'apiTesting',
    descKey: 'apiTestingDesc',
    path: '/api-testing',
    icon: Globe,
    iconBg: 'bg-[#4EC9B0]/10',
    iconColor: 'text-[#4EC9B0]',
    priority: 10,
  },
  {
    id: 'browser-matrix',
    titleKey: 'browserMatrix',
    descKey: 'browserMatrixDesc',
    path: '/browser-matrix',
    icon: Globe,
    iconBg: 'bg-[#0F766E]/10',
    iconColor: 'text-[#0F766E]',
    priority: 10,
  },
]

export function getQuickActionsForRole(userOrRole) {
  const user =
    typeof userOrRole === 'string' || !userOrRole
      ? { role: userOrRole || 'USER' }
      : userOrRole
  const allowed = new Set(resolveUserMenuPaths(user))
  const list =
    user.role === 'ADMIN'
      ? QUICK_ACTIONS
      : QUICK_ACTIONS.filter((action) => allowed.has(action.path))
  // USER/VIEWER/LEAD: keep Manual QA actions prominent (max 4)
  if (user.role !== 'ADMIN') {
    return [...list].sort((a, b) => (a.priority || 99) - (b.priority || 99)).slice(0, 4)
  }
  return list
}
