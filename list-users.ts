import { prisma } from "./src/lib/prisma"

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      userStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  })

  console.table(users)
}

main()
  .catch((err) => {
    console.error("Error listing users:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

