import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Testing Prisma Client connection...')
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1`
    console.log('✓ Database connection successful:', result)
    
    // List all tables
    console.log('\nChecking database tables...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    
    console.log('✓ Database tables created:')
    tables.forEach(t => console.log(`  - ${t.table_name}`))
    
    // Test User model
    console.log('\nTesting User model...')
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword123',
        name: 'Test User'
      }
    })
    console.log('✓ User created:', user)
    
    // Clean up
    await prisma.user.delete({
      where: { id: user.id }
    })
    console.log('✓ Test user cleaned up')
    
    console.log('\n✓ ALL TESTS PASSED!')
    
  } catch (error) {
    console.error('✗ Test failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
