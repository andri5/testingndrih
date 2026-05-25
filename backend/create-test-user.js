import { PrismaClient } from '@prisma/client'
import { hashPassword } from './src/utils/password.js'

const prisma = new PrismaClient()

async function main() {
  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'admin@testingndrih.local' }
    })

    if (existing) {
      console.log('✅ User already exists:', existing.email)
      console.log('   ID:', existing.id)
      console.log('   Name:', existing.name)
      return
    }

    // Hash password
    const hashedPassword = await hashPassword('AdminPass123!')

    // Create user
    const user = await prisma.user.create({
      data: {
        email: 'admin@testingndrih.local',
        password: hashedPassword,
        name: 'Admin User'
      }
    })

    console.log('✅ User created successfully!')
    console.log('   Email:', user.email)
    console.log('   Name:', user.name)
    console.log('   ID:', user.id)
    console.log('')
    console.log('🔑 Credentials:')
    console.log('   Email: admin@testingndrih.local')
    console.log('   Password: AdminPass123!')
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
