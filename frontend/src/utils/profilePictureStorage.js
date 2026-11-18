const LEGACY_KEY = 'profilePicture'
const MAX_EDGE = 256
const JPEG_QUALITY = 0.72
/** Skip migrating legacy avatars larger than this (~raw JSON chars). */
const MAX_LEGACY_CHARS = 400_000

export function profilePictureKey(userId) {
  if (!userId) return null
  return `profilePicture:${userId}`
}

function readRaw(key) {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function isQuotaError(err) {
  return (
    err?.name === 'QuotaExceededError' ||
    err?.code === 22 ||
    err?.code === 1014 ||
    /quota/i.test(err?.message || '')
  )
}

/** Drop unused avatar keys so a new save can fit in ~5MB localStorage. */
export function pruneOtherProfilePictures(keepUserId) {
  const keepKey = profilePictureKey(keepUserId)
  const toRemove = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (!key) continue
    if (key === LEGACY_KEY) toRemove.push(key)
    else if (key.startsWith('profilePicture:') && key !== keepKey) toRemove.push(key)
  }
  toRemove.forEach((key) => localStorage.removeItem(key))
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (err) {
    if (!isQuotaError(err)) throw err
    return false
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read image'))
    img.src = src
  })
}

function canvasToJpeg(img) {
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process image')
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

/**
 * Resize/compress a data-URL or File/Blob into a small JPEG data-URL for localStorage.
 */
export async function compressProfilePicture(source) {
  if (typeof source === 'string') {
    const img = await loadImage(source)
    return canvasToJpeg(img)
  }
  if (typeof Blob !== 'undefined' && source instanceof Blob) {
    const objectUrl = URL.createObjectURL(source)
    try {
      const img = await loadImage(objectUrl)
      return canvasToJpeg(img)
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }
  throw new Error('Unsupported image source')
}

/**
 * Move the old shared `profilePicture` key onto this user once.
 * Never throws QuotaExceededError — oversized legacy photos are dropped.
 */
export function claimLegacyProfilePicture(userId) {
  if (!userId) return null
  try {
    const key = profilePictureKey(userId)
    if (localStorage.getItem(key)) {
      localStorage.removeItem(LEGACY_KEY)
      return readRaw(key)
    }
    const legacy = readRaw(LEGACY_KEY)
    if (!legacy) return null

    const payload = JSON.stringify(legacy)
    if (payload.length > MAX_LEGACY_CHARS) {
      localStorage.removeItem(LEGACY_KEY)
      return null
    }

    if (!safeSetItem(key, payload)) {
      pruneOtherProfilePictures(userId)
      if (!safeSetItem(key, payload)) {
        localStorage.removeItem(LEGACY_KEY)
        return null
      }
    }
    localStorage.removeItem(LEGACY_KEY)
    return legacy
  } catch {
    try {
      localStorage.removeItem(LEGACY_KEY)
    } catch {
      /* ignore */
    }
    return null
  }
}

export function getProfilePicture(userId) {
  if (!userId) return null
  return readRaw(profilePictureKey(userId))
}

/**
 * @returns {{ ok: true, picture: string } | { ok: false, error: string }}
 */
export function setProfilePicture(userId, base64String) {
  if (!userId) return { ok: false, error: 'Not signed in' }
  const key = profilePictureKey(userId)
  const payload = JSON.stringify(base64String)
  localStorage.removeItem(LEGACY_KEY)

  if (safeSetItem(key, payload)) {
    return { ok: true, picture: base64String }
  }

  pruneOtherProfilePictures(userId)
  if (safeSetItem(key, payload)) {
    return { ok: true, picture: base64String }
  }

  return {
    ok: false,
    error: 'Browser storage is full. Try a smaller photo, or clear site data for this site.',
  }
}

export function clearLegacyProfilePicture() {
  localStorage.removeItem(LEGACY_KEY)
}
