import { recorderService } from '../services/recorderService.js'

export const recorderController = {
  async startRecording(req, res, next) {
    try {
      const userId = req.user.id
      const { scenarioId, url } = req.body
      if (!scenarioId) {
        return res.status(400).json({ error: 'scenarioId diperlukan' })
      }
      const result = await recorderService.startRecording(userId, scenarioId, url)
      res.json(result)
    } catch (err) {
      if (err.message.includes('sudah berjalan') || err.message.includes('tidak ditemukan')) {
        return res.status(400).json({ error: err.message })
      }
      next(err)
    }
  },

  async stopRecording(req, res, next) {
    try {
      const userId = req.user.id
      const { scenarioId } = req.body
      if (!scenarioId) {
        return res.status(400).json({ error: 'scenarioId diperlukan' })
      }
      const result = await recorderService.stopRecording(userId, scenarioId)
      res.json(result)
    } catch (err) {
      if (err.message.includes('Tidak ada recording')) {
        return res.status(400).json({ error: err.message })
      }
      next(err)
    }
  },

  getStatus(req, res) {
    const userId = req.user.id
    const scenarioId = req.query.scenarioId || req.params.scenarioId
    if (!scenarioId) {
      return res.status(400).json({ error: 'scenarioId diperlukan' })
    }
    const result = recorderService.getStatus(userId, scenarioId)
    res.json(result)
  },

  async saveSteps(req, res, next) {
    try {
      const userId = req.user.id
      const { scenarioId } = req.params
      const { steps } = req.body
      if (!steps || !Array.isArray(steps) || steps.length === 0) {
        return res.status(400).json({ error: 'steps array diperlukan' })
      }
      const result = await recorderService.saveRecordedSteps(userId, scenarioId, steps)
      res.json(result)
    } catch (err) {
      if (err.message.includes('tidak ditemukan')) {
        return res.status(404).json({ error: err.message })
      }
      next(err)
    }
  }
}
