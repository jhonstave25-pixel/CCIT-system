// Script to create an admin user
// Usage: node create-admin.js "your-email@example.com" "Your Name" ["password123"] ["ADMIN"]

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function createAdmin() {
  const email = process.argv[2] || 'admin@alumni.com'
  const name = process.argv[3] || 'Admin User'
  const password = process.argv[4] || null
  const role = process.argv[5] || 'ADMIN'

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      // Update existing user to admin
      const updateData = {
        role: role,
        emailVerified: new Date(),
      }
      // Add password if provided
      if (password) {
        updateData.password = await bcrypt.hash(password, 10)
      }
      const updated = await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: updateData,
      })
      console.log(`✅ Updated existing user to ${role}:`)
      console.log(`   Email: ${updated.email}`)
      console.log(`   Name: ${updated.name}`)
      console.log(`   Role: ${updated.role}`)
      if (password) {
        console.log(`   Password set: Yes`)
      }
    } else {
      // Create new admin user
      const createData = {
        email: email.toLowerCase(),
        name: name,
        role: role,
        emailVerified: new Date(),
      }
      // Add password if provided
      if (password) {
        createData.password = await bcrypt.hash(password, 10)
      }
      const admin = await prisma.user.create({
        data: createData,
      })
      console.log(`✅ Created new ${role} user:`)
      console.log(`   Email: ${admin.email}`)
      console.log(`   Name: ${admin.name}`)
      console.log(`   Role: ${admin.role}`)
      if (password) {
        console.log(`   Password: ${password}`)
      }
    }

    console.log('\n📧 To sign in:')
    console.log('   1. Go to http://localhost:3000/login')
    console.log(`   2. Enter email: ${email}`)
    if (password) {
      console.log(`   3. Enter password: ${password}`)
      console.log('   4. You will be redirected to /admin')
    } else {
      console.log('   3. Check your email for OTP code')
      console.log('   4. Enter OTP and you will be redirected to /admin')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()


