import * as userService from '../services/userService.js'

export async function listUsers(req, res, next) {
  try {
    const users = await userService.listUsers()
    res.json({ success: true, users })
  } catch (error) {
    next(error)
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body
    const user = await userService.updateUserRole(
      req.user.email,
      req.params.userId,
      role
    )
    res.json({ success: true, user })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message })
    }
    next(error)
  }
}
