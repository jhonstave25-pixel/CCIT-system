import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Hash password for test accounts
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create an admin user with password
  const admin = await prisma.user.upsert({
    where: { email: 'admin@alumni.com' },
    update: {},
    create: {
      email: 'admin@alumni.com',
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: new Date(),
      password: hashedPassword,
      profile: {
        create: {
          graduationYear: 2020,
          degree: 'Bachelor of Science',
          major: 'Computer Science',
          batch: '2020',
          isPublic: true,
        },
      },
    },
  })

  // Create a faculty user with password
  const faculty = await prisma.user.upsert({
    where: { email: 'faculty@alumni.com' },
    update: {},
    create: {
      email: 'faculty@alumni.com',
      name: 'Faculty Member',
      role: 'FACULTY',
      emailVerified: new Date(),
      password: hashedPassword,
    },
  })

  // Create an alumni user with password
  const alumni = await prisma.user.upsert({
    where: { email: 'alumni@alumni.com' },
    update: {},
    create: {
      email: 'alumni@alumni.com',
      name: 'Alumni Member',
      role: 'ALUMNI',
      emailVerified: new Date(),
      password: hashedPassword,
      profile: {
        create: {
          graduationYear: 2021,
          degree: 'Bachelor of Science',
          major: 'Computer Science',
          batch: '2021',
          isPublic: true,
        },
      },
    },
  })

  console.log('Seed data created:', { admin, faculty, alumni })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

