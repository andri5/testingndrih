import {
  ALL_MENU_KEYS,
  DEFAULT_USER_MENU_KEYS,
  resolveUserMenuKeys,
  validateMenuKeys,
} from '../menuPermissions.js'

describe('menuPermissions', () => {
  it('resolves all menus for admin', () => {
    expect(resolveUserMenuKeys({ role: 'ADMIN' })).toEqual(ALL_MENU_KEYS)
  })

  it('uses defaults when user has no assigned menus', () => {
    expect(resolveUserMenuKeys({ role: 'USER', menuPermissions: [] })).toEqual(
      DEFAULT_USER_MENU_KEYS
    )
  })

  it('uses assigned menus for user', () => {
    expect(
      resolveUserMenuKeys({
        role: 'USER',
        menuPermissions: ['dashboard', 'scenarios'],
      })
    ).toEqual(['dashboard', 'scenarios'])
  })

  it('validates menu keys', () => {
    expect(validateMenuKeys(['dashboard']).valid).toBe(true)
    expect(validateMenuKeys([]).valid).toBe(false)
    expect(validateMenuKeys(['invalid']).valid).toBe(false)
  })
})
