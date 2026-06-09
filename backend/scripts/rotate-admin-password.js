import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/utils/password.js'

const prisma = new PrismaClient()

function validatePassword(password) {
  const errors = []
  if (!password || password.length < 12) errors.push('minimal 12 karakter')
  if (!/[A-Z]/.test(password)) errors.push('minimal 1 huruf besar')
  if (!/[a-z]/.test(password)) errors.push('minimal 1 huruf kecil')
  if (!/[0-9]/.test(password)) errors.push('minimal 1 angka')
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('minimal 1 karakter spesial')
  }
  return errors
}

async function main() {
  const email = process.env.ADMIN_EMAIL || process.env.SEED_EMAIL || 'admin@testingndrih.local'
  const newPassword = process.env.NEW_ADMIN_PASSWORD

  if (!newPassword) {
    console.error('Set NEW_ADMIN_PASSWORD before running this script.')
    process.exit(1)
  }

  const passwordErrors = validatePassword(newPassword)
  if (passwordErrors.length > 0) {
    console.error(`Password tidak memenuhi syarat: ${passwordErrors.join(', ')}`)
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error(`User not found: ${email}`)
    process.exit(1)
  }

  const hashedPassword = await hashPassword(newPassword)
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  })

  console.log(`Admin password updated for ${email}`)
}

main()
  .catch((error) => {
    console.error('Failed to rotate admin password:', error.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
