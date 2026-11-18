import {
  Plus,
  PlayCircle,
  TrendingUp,
  Globe,
  Layers,
  Clock,
  GitBranch,
  Activity,
  Gauge,
  Shield,
} from 'lucide-react'
import { resolveUserMenuPaths } from './menuPermissions'

/**
 * Dashboard quick actions — filtered by the menus the user can actually open.
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
  },
  {
    id: 'run-execution',
    titleKey: 'runExecution',
    descKey: 'executeScenario',
    path: '/execution',
    icon: PlayCircle,
    iconBg: 'bg-[#34D399]/10',
    iconColor: 'text-[#34D399]',
  },
  {
    id: 'view-analytics',
    titleKey: 'viewAnalytics',
    descKey: 'detailedMetrics',
    path: '/analytics',
    icon: TrendingUp,
    iconBg: 'bg-[#0F766E]/10',
    iconColor: 'text-[#0F766E]',
  },
  {
    id: 'api-testing',
    titleKey: 'apiTesting',
    descKey: 'apiTestingDesc',
    path: '/api-testing',
    icon: Globe,
    iconBg: 'bg-[#4EC9B0]/10',
    iconColor: 'text-[#4EC9B0]',
  },
  {
    id: 'environments',
    titleKey: 'environments',
    descKey: 'environmentsDesc',
    path: '/environments',
    icon: Layers,
    iconBg: 'bg-[#0F766E]/10',
    iconColor: 'text-[#0F766E]',
  },
  {
    id: 'scheduler',
    titleKey: 'scheduler',
    descKey: 'schedulerDesc',
    path: '/scheduler',
    icon: Clock,
    iconBg: 'bg-[#0F766E]/10',
    iconColor: 'text-[#0F766E]',
  },
  {
    id: 'parallel',
    titleKey: 'parallel',
    descKey: 'parallelDesc',
    path: '/parallel',
    icon: GitBranch,
    iconBg: 'bg-[#34D399]/10',
    iconColor: 'text-[#34D399]',
  },
  {
    id: 'smoke-test',
    titleKey: 'smokeTest',
    descKey: 'smokeTestDesc',
    path: '/smoke-test',
    icon: Activity,
    iconBg: 'bg-[#4EC9B0]/10',
    iconColor: 'text-[#4EC9B0]',
  },
  {
    id: 'stress-test',
    titleKey: 'stressTest',
    descKey: 'stressTestDesc',
    path: '/stress-test',
    icon: Gauge,
    iconBg: 'bg-[#F87171]/10',
    iconColor: 'text-[#F87171]',
  },
  {
    id: 'security-test',
    titleKey: 'securityTest',
    descKey: 'securityTestDesc',
    path: '/security-test',
    icon: Shield,
    iconBg: 'bg-[#FBBF24]/10',
    iconColor: 'text-[#FBBF24]',
  },
  {
    id: 'browser-matrix',
    titleKey: 'browserMatrix',
    descKey: 'browserMatrixDesc',
    path: '/browser-matrix',
    icon: Globe,
    iconBg: 'bg-[#0F766E]/10',
    iconColor: 'text-[#0F766E]',
  },
]

export function getQuickActionsForRole(userOrRole) {
  const user =
    typeof userOrRole === 'string' || !userOrRole
      ? { role: userOrRole || 'USER' }
      : userOrRole
  if (user.role === 'ADMIN') return QUICK_ACTIONS
  const allowed = new Set(resolveUserMenuPaths(user))
  return QUICK_ACTIONS.filter((action) => allowed.has(action.path))
}
