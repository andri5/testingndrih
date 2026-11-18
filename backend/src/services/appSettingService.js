import { prisma } from '../lib/prisma.js'
import {
  ALL_MENU_KEYS,
  DEFAULT_USER_MENU_KEYS,
  validateMenuKeys,
} from '../constants/menuPermissions.js'
import { getRoleMenuPreset, NON_ADMIN_ROLES } from '../constants/roles.js'

export const USER_ENABLED_MENUS_KEY = 'user_enabled_menus'

/**
 * Global catalog of menus available to non-admin roles.
 * Missing setting → all menus (role presets still limit LEAD / USER / VIEWER).
 */
export async function getEnabledUserMenus() {
  try {
    const row = await prisma.appSetting.findUnique({
      where: { key: USER_ENABLED_MENUS_KEY },
    })
    if (!row || !Array.isArray(row.value)) {
      return [...ALL_MENU_KEYS]
    }
    const keys = row.value.filter((k) => ALL_MENU_KEYS.includes(k))
    return keys.length > 0 ? keys : [...ALL_MENU_KEYS]
  } catch {
    return [...ALL_MENU_KEYS]
  }
}

export async function setEnabledUserMenus(menus, { syncUsers = false } = {}) {
  const validation = validateMenuKeys(menus)
  if (!validation.valid) {
    const err = new Error(validation.message)
    err.status = 400
    throw err
  }

  const keys = validation.keys
  await prisma.appSetting.upsert({
    where: { key: USER_ENABLED_MENUS_KEY },
    create: { key: USER_ENABLED_MENUS_KEY, value: keys },
    update: { value: keys },
  })

  let syncedUsers = 0
  if (syncUsers) {
    const users = await prisma.user.findMany({
      where: { role: { in: NON_ADMIN_ROLES } },
      select: { id: true, role: true },
    })
    await Promise.all(
      users.map((user) =>
        prisma.user.update({
          where: { id: user.id },
          data: {
            menuPermissions: getRoleMenuPreset(user.role).filter((k) =>
              keys.includes(k)
            ),
          },
        })
      )
    )
    syncedUsers = users.length
  }

  return { menus: keys, syncedUsers }
}
