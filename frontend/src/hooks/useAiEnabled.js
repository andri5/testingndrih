import { useState, useEffect, useCallback } from 'react'
import { aiAPI } from '../services/api'

let cached = null
let cacheTime = 0
const CACHE_MS = 30_000

export function useAiEnabled() {
  const [configured, setConfigured] = useState(cached?.configured ?? false)
  const [quota, setQuota] = useState(cached?.quota ?? null)
  const [loading, setLoading] = useState(cached === null)

  const refresh = useCallback(() => {
    return aiAPI.getStatus()
      .then((res) => {
        const data = res.data || {}
        const q = data.quota || null
        cached = {
          configured: !!data.enabled,
          quota: q,
        }
        cacheTime = Date.now()
        setConfigured(!!data.enabled)
        setQuota(q)
      })
      .catch(() => {
        cached = { configured: false, quota: null }
        cacheTime = Date.now()
        setConfigured(false)
        setQuota(null)
      })
  }, [])

  useEffect(() => {
    const now = Date.now()
    if (cached !== null && now - cacheTime < CACHE_MS) {
      setConfigured(cached.configured)
      setQuota(cached.quota)
      setLoading(false)
      return
    }
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const canUse = configured && (quota?.canUse ?? true)
  const remaining = quota?.remaining ?? null

  return {
    enabled: canUse,
    configured,
    canUse,
    quota,
    remaining,
    loading,
    refresh,
  }
}

export function invalidateAiStatusCache() {
  cached = null
  cacheTime = 0
}

export function formatAiQuotaMessage(quota) {
  if (!quota) return null
  if (quota.canUse) {
    return `Sisa kuota AI hari ini: ${quota.dailyRemaining}/${quota.dailyLimit} (${quota.hourlyRemaining} tersisa per jam)`
  }
  if (quota.blockedReason === 'user_daily') {
    return `Kuota harian Anda habis (${quota.dailyLimit}/hari). Reset besok.`
  }
  if (quota.blockedReason === 'user_hourly') {
    return `Kuota per jam habis (${quota.hourlyLimit}/jam). Coba lagi ~1 jam.`
  }
  if (quota.blockedReason === 'global_daily') {
    return 'Kuota AI server hari ini sudah habis. Coba lagi besok.'
  }
  if (quota.providerCooldown) {
    return 'AI sibuk sementara (limit provider). Coba lagi dalam 1–2 menit.'
  }
  return 'Kuota AI tidak tersedia saat ini.'
}
