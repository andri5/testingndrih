const LEGACY_KEY = 'profilePicture'

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

/**
 * Move the old shared `profilePicture` key onto this user once.
 * Call on login only — never on register — so new accounts stay blank.
 */
export function claimLegacyProfilePicture(userId) {
  if (!userId) return null
  const key = profilePictureKey(userId)
  if (localStorage.getItem(key)) {
    localStorage.removeItem(LEGACY_KEY)
    return readRaw(key)
  }
  const legacy = readRaw(LEGACY_KEY)
  if (!legacy) return null
  localStorage.setItem(key, JSON.stringify(legacy))
  localStorage.removeItem(LEGACY_KEY)
  return legacy
}

export function getProfilePicture(userId) {
  if (!userId) return null
  return readRaw(profilePictureKey(userId))
}

export function setProfilePicture(userId, base64String) {
  if (!userId) return
  localStorage.setItem(profilePictureKey(userId), JSON.stringify(base64String))
  localStorage.removeItem(LEGACY_KEY)
}

export function clearLegacyProfilePicture() {
  localStorage.removeItem(LEGACY_KEY)
}
