import { authenticateToken } from './auth.js'
import { refreshUserRole } from './refreshUserRole.js'
import { requireRole } from './requireRole.js'

/** Auth stack for admin-only API routes (Option A). */
export const adminAuth = [authenticateToken, refreshUserRole, requireRole('ADMIN')]
