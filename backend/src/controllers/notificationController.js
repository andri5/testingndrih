import * as notificationService from '../services/notificationService.js'

export async function getSettingsHandler(req, res, next) {
  try {
    const settings = await notificationService.getNotificationSettings(req.user.id)
    res.json({ success: true, settings })
  } catch (error) {
    next(error)
  }
}

export async function updateSettingsHandler(req, res, next) {
  try {
    const settings = await notificationService.updateNotificationSettings(req.user.id, req.body)
    res.json({ success: true, settings })
  } catch (error) {
    next(error)
  }
}
