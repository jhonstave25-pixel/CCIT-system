// Script to create a user with a password
// Usage: node create-user-with-password.js "email@example.com" "Your Name" "password123" "ALUMNI"

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function createUser() {
  const email = process.argv[2]
  const name = process.argv[3] || 'User'
  const password = process.argv[4]
  const role = process.argv[5] || 'ALUMNI' // ALUMNI, FACULTY, ADMIN

  if (!email) {
    console.error('❌ Error: Email is required')
    console.log('\nUsage: node create-user-with-password.js "email@example.com" "Your Name" "password123" "ALUMNI"')
    process.exit(1)
  }

  if (!password) {
    console.error('❌ Error: Password is required')
    console.log('\nUsage: node create-user-with-password.js "email@example.com" "Your Name" "password123" "ALUMNI"')
    process.exit(1)
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      // Update existing user with password
      const hashedPassword = await bcrypt.hash(password, 10)
      const updated = await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          password: hashedPassword,
          emailVerified: new Date(),
          role: role,
        },
      })
      console.log(`✅ Updated existing user with password:`)
      console.log(`   Email: ${updated.email}`)
      console.log(`   Name: ${updated.name || name}`)
      console.log(`   Role: ${updated.role}`)
    } else {
      // Create new user with password
      const hashedPassword = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name,
          password: hashedPassword,
          role: role,
          emailVerified: new Date(),
        },
      })
      console.log(`✅ Created new user with password:`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Role: ${user.role}`)
    }

    console.log('\n📧 You can now sign in:')
    console.log('   1. Go to http://localhost:3000/login')
    console.log(`   2. Email: ${email}`)
    console.log(`   3. Password: ${password}`)
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createUser()

