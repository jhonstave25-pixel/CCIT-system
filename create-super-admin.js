// Script to create super admin user "james" with password "password123"
// Usage: node create-super-admin.js

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createSuperAdmin() {
  try {
    const email = 'james@alumni.com' // Using email as username
    const name = 'James'
    const password = 'password123'
    const role = 'SUPER_ADMIN'

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      // Update existing user to super admin with password
      const updated = await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          name: name,
          role: role,
          password: hashedPassword,
          emailVerified: new Date(),
        },
      })
      console.log('✅ Updated existing user to SUPER_ADMIN:')
      console.log(`   Email: ${updated.email}`)
      console.log(`   Name: ${updated.name}`)
      console.log(`   Role: ${updated.role}`)
      console.log(`   Password: ${password}`)
    } else {
      // Create new super admin user
      const admin = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name,
          role: role,
          password: hashedPassword,
          emailVerified: new Date(),
        },
      })
      console.log('✅ Created new SUPER_ADMIN user:')
      console.log(`   Email: ${admin.email}`)
      console.log(`   Name: ${admin.name}`)
      console.log(`   Role: ${admin.role}`)
      console.log(`   Password: ${password}`)
    }

    console.log('\n📧 To sign in:')
    console.log('   1. Go to http://localhost:3000/login')
    console.log('   2. Use the "Alumni/Faculty" tab')
    console.log(`   3. Email: ${email}`)
    console.log(`   4. Password: ${password}`)
    console.log('   5. You will be redirected to /admin')
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

createSuperAdmin()

