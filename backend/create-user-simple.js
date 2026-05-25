#!/usr/bin/env node
import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function createUser() {
  try {
    const hash = await bcryptjs.hash('AdminPass123!', 10)
    
    const user = await prisma.user.upsert({
      where: { email: 'admin@testingndrih.local' },
      update: {},
      create: {
        email: 'admin@testingndrih.local',
        name: 'Admin User',
        password: hash
      }
    })
    
    console.log('✅ User created:', user.email, user.name)
  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

createUser()
