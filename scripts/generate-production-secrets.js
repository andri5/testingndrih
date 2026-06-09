#!/usr/bin/env node
import crypto from 'crypto'

function randomHex(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex')
}

const jwtSecret = randomHex(32)
const dbPassword = randomHex(18)
const encryptionKey = randomHex(32)

console.log('# Paste into /opt/testingndrih/.env on the VPS')
console.log('# Keep these values private — never commit .env to git')
console.log('')
console.log(`JWT_SECRET=${jwtSecret}`)
console.log(`ENCRYPTION_KEY=${encryptionKey}`)
console.log(`DB_PASSWORD=${dbPassword}`)
console.log(`DATABASE_URL=postgresql://testingndrih_user:${dbPassword}@postgres:5432/testingndrih`)
console.log('')
console.log('# After updating DB_PASSWORD, recreate postgres only on a fresh server.')
console.log('# On an existing server, change the DB password inside postgres first.')
console.log('')
console.log('# Rotate admin login password:')
console.log('# docker compose exec -e NEW_ADMIN_PASSWORD="YourStrongPass123!" app node scripts/rotate-admin-password.js')
