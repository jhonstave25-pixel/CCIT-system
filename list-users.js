const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        password: true
      }
    })
    
    console.log(`\n📊 Total users in database: ${users.length}\n`)
    
    if (users.length === 0) {
      console.log('❌ No users found in database!')
      console.log('\nYou need to either:')
      console.log('1. Register a new account at /register')
      console.log('2. Run the seed script: npx prisma db seed')
      console.log('3. Create an admin account using create-admin.js or create-super-admin.js\n')
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`)
        console.log(`   Name: ${user.name || 'N/A'}`)
        console.log(`   Role: ${user.role}`)
        console.log(`   Has Password: ${user.password ? 'Yes' : 'No'}`)
        console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`)
        console.log('')
      })
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

listUsers()

