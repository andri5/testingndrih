import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 10

/**
 * Hash a password with bcryptjs
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

/**
 * Compare a password with its hash
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}
