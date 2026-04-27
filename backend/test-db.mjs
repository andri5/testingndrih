import { prisma } from './src/lib/prisma.js'
try {
  const u = await prisma.user.findMany({ select: { email: true }, take: 1 })
  console.log('Users:', JSON.stringify(u))
  await prisma.testChain.findMany({ take: 1 }); console.log('Chains OK')
  await prisma.testSchedule.findMany({ take: 1 }); console.log('Schedules OK')
  await prisma.executionBatch.findMany({ take: 1 }); console.log('Batches OK')
  await prisma.matrixExecution.findMany({ take: 1 }); console.log('Matrix OK')
} catch(e) { console.error('ERROR:', e.message) }
await prisma.$disconnect()
