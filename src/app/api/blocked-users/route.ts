import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const blocks = await prisma.block.findMany({
      where: { blockerId: session.user.id },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            profile: {
              select: {
                batch: true,
                degree: true,
                currentCompany: true,
                currentPosition: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ blockedUsers: blocks })
  } catch (error) {
    console.error("Error fetching blocked users:", error)
    return NextResponse.json(
      { error: "Failed to fetch blocked users" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { blockedId, reason } = await req.json()

    if (!blockedId) {
      return NextResponse.json({ error: "blockedId is required" }, { status: 400 })
    }

    if (session.user.id === blockedId) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 })
    }

    // Check if already blocked
    const existing = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: "User already blocked" }, { status: 409 })
    }

    const block = await prisma.block.create({
      data: {
        blockerId: session.user.id,
        blockedId,
        reason,
      },
    })

    return NextResponse.json({ success: true, block })
  } catch (error) {
    console.error("Error blocking user:", error)
    return NextResponse.json(
      { error: "Failed to block user" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const blockedId = searchParams.get("blockedId")

    if (!blockedId) {
      return NextResponse.json({ error: "blockedId is required" }, { status: 400 })
    }

    await prisma.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error unblocking user:", error)
    return NextResponse.json(
      { error: "Failed to unblock user" },
      { status: 500 }
    )
  }
}
