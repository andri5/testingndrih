import crypto from 'crypto'

const ALGO = 'aes-256-gcm'

function getEncryptionKey() {
  const raw = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'dev-secret-key'
  return crypto.scryptSync(raw, 'testingndrih-env-salt', 32)
}

export function encryptSecret(plaintext) {
  if (plaintext == null) return ''
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, getEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptSecret(ciphertext) {
  if (!ciphertext || !ciphertext.includes(':')) return ciphertext
  const [ivHex, tagHex, dataHex] = ciphertext.split(':')
  if (!ivHex || !tagHex || !dataHex) return ciphertext
  const decipher = crypto.createDecipheriv(ALGO, getEncryptionKey(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final()
  ])
  return decrypted.toString('utf8')
}
