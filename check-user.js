const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUser() {
  try {
    const email = 'junriolomongo2023@gmail.com'
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })
    
    if (user) {
      console.log('✅ User found!')
      console.log('Email:', user.email)
      console.log('Role:', user.role)
      console.log('Has password:', !!user.password)
      console.log('Email verified:', !!user.emailVerified)
      console.log('Status:', user.status)
    } else {
      console.log('❌ User NOT found in database')
      console.log('Searched for:', email.toLowerCase())
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()

