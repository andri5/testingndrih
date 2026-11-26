/** Lab QA cool — shared severity / priority tokens */

export const SEVERITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

/** Soft chip / badge (table cells, shared bug, issue list) */
export const SEVERITY_BADGE_CLASS = {
  LOW: 'border-accent/20 bg-accent-soft text-accent-ink',
  MEDIUM: 'border-brand/30 bg-brand-soft text-brand-ink',
  HIGH: 'border-[#F59E0B]/45 bg-[#FFFBEB] text-[#92400E]',
  CRITICAL: 'border-[#EF4444]/40 bg-[#FEF2F2] text-[#991B1B]',
}

/** Dot accent inside badge */
export const SEVERITY_DOT_CLASS = {
  LOW: 'bg-accent',
  MEDIUM: 'bg-brand',
  HIGH: 'bg-[#D97706]',
  CRITICAL: 'bg-[#DC2626]',
}

/**
 * Closed <select> surface — cool / professional, not cream-amber mud.
 * Options stay system-native; focus ring uses brand.
 */
export const SEVERITY_SELECT_CLASS = {
  LOW: 'border-accent/30 bg-accent-soft text-accent-ink focus:ring-brand focus:border-brand',
  MEDIUM: 'border-brand/35 bg-brand-soft text-brand-ink focus:ring-brand focus:border-brand',
  HIGH: 'border-[#F59E0B]/50 bg-[#FFFBEB] text-[#92400E] focus:ring-brand focus:border-brand',
  CRITICAL: 'border-[#EF4444]/45 bg-[#FEF2F2] text-[#991B1B] focus:ring-brand focus:border-brand',
}

export function normalizeSeverity(value) {
  const level = String(value || 'MEDIUM').toUpperCase()
  return SEVERITY_LEVELS.includes(level) ? level : 'MEDIUM'
}

export function severityBadgeClass(value) {
  return SEVERITY_BADGE_CLASS[normalizeSeverity(value)]
}

export function severitySelectClass(value) {
  return SEVERITY_SELECT_CLASS[normalizeSeverity(value)]
}

export function severityDotClass(value) {
  return SEVERITY_DOT_CLASS[normalizeSeverity(value)]
}
