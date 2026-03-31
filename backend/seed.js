import { PrismaClient } from '@prisma/client'
import { hashPassword } from './src/utils/password.js'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 Starting database seed...')

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'donkditren@gmail.com' }
    })

    if (existingUser) {
      console.log('✅ Test user already exists')
      return
    }

    // Hash password
    const hashedPassword = await hashPassword('password*1')

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'donkditren@gmail.com',
        password: hashedPassword,
        name: 'Test User'
      }
    })

    console.log('✅ Test user created:', user.email)
  } catch (error) {
    console.error('❌ Seed error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
