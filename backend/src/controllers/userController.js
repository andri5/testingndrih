import * as userService from '../services/userService.js'
import * as userActivityService from '../services/userActivityService.js'
import {
  getEnabledUserMenus,
  setEnabledUserMenus,
} from '../services/appSettingService.js'
import {
  ALL_MENU_KEYS,
  DEFAULT_USER_MENU_KEYS,
  MENU_DEFINITIONS,
} from '../constants/menuPermissions.js'
import {
  ROLE_DEFINITIONS,
  ROLE_MENU_PRESETS,
  ASSIGNABLE_ROLES,
} from '../constants/roles.js'

function handleServiceError(error, res, next) {
  if (error.status) {
    return res.status(error.status).json({ success: false, message: error.message })
  }
  return next(error)
}

export async function listUsers(req, res, next) {
  try {
    const users = await userService.listUsers()
    res.json({ success: true, users })
  } catch (error) {
    next(error)
  }
}

export async function getUser(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.userId)
    res.json({ success: true, user })
  } catch (error) {
    return handleServiceError(error, res, next)
  }
}

export async function createUser(req, res, next) {
  try {
    const { email, name, password, role, isActive } = req.body
    const user = await userService.createUser({
      email,
      name,
      password,
      role,
      isActive,
    })
    res.status(201).json({ success: true, user })
  } catch (error) {
    return handleServiceError(error, res, next)
  }
}

export async function updateUser(req, res, next) {
  try {
    const { name, email, role, password, isActive } = req.body
    const user = await userService.updateUser(req.user, req.params.userId, {
      name,
      email,
      role,
      password,
      isActive,
    })
    res.json({ success: true, user })
  } catch (error) {
    return handleServiceError(error, res, next)
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body
    const user = await userService.updateUserRole(req.user, req.params.userId, role)
    res.json({ success: true, user })
  } catch (error) {
    return handleServiceError(error, res, next)
  }
}

export async function setUserActive(req, res, next) {
  try {
    const { isActive } = req.body
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean',
      })
    }
    const user = await userService.setUserActive(
      req.user,
      req.params.userId,
      isActive
    )
    res.json({ success: true, user })
  } catch (error) {
    return handleServiceError(error, res, next)
  }
}

export async function updateUserMenus(req, res, next) {
  try {
    const { menus } = req.body
    const user = await userService.updateUserMenus(req.user, req.params.userId, menus)
    res.json({ success: true, user })
  } catch (error) {
    return handleServiceError(error, res, next)
  }
}

export async function getMenuDefaults(req, res, next) {
  try {
    const menus = await getEnabledUserMenus()
    res.json({
      success: true,
      menus,
      defaults: DEFAULT_USER_MENU_KEYS,
      catalog: MENU_DEFINITIONS,
      allKeys: ALL_MENU_KEYS,
      roles: ROLE_DEFINITIONS,
      assignableRoles: ASSIGNABLE_ROLES,
      rolePresets: ROLE_MENU_PRESETS,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateMenuDefaults(req, res, next) {
  try {
    const { menus, syncUsers = false } = req.body || {}
    const result = await setEnabledUserMenus(menus, { syncUsers: Boolean(syncUsers) })
    res.json({
      success: true,
      menus: result.menus,
      syncedUsers: result.syncedUsers,
      message: syncUsers
        ? `Saved. Synced ${result.syncedUsers} USER account(s).`
        : 'Saved global USER menu access.',
    })
  } catch (error) {
    return handleServiceError(error, res, next)
  }
}

export async function deleteUser(req, res, next) {
  try {
    const deleted = await userService.deleteUser(req.user, req.params.userId)
    res.json({ success: true, deleted })
  } catch (error) {
    return handleServiceError(error, res, next)
  }
}

export async function getUserActivitySummary(req, res, next) {
  try {
    const users = await userActivityService.getUserActivitySummary()
    res.json({ success: true, users })
  } catch (error) {
    next(error)
  }
}

export async function getUserActivityLog(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100)
    const result = await userActivityService.getUserActivityLog(
      req.params.userId,
      limit
    )
    res.json({ success: true, ...result })
  } catch (error) {
    return handleServiceError(error, res, next)
  }
}
