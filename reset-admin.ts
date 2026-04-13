import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const email = "jhonstave2@gmail.com"
  const plainPassword = "12345678"
  const password = await bcrypt.hash(plainPassword, 10)

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      password,
      role: "ADMIN",
      userStatus: "VERIFIED",
    },
    create: {
      email: email.toLowerCase(),
      name: "Admin",
      role: "ADMIN",
      password,
      userStatus: "VERIFIED",
    },
  })

  console.log("Admin ready:")
  console.log({ email, password: plainPassword, role: user.role })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

