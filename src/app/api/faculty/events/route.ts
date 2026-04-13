import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"
import { EVENT_CATEGORIES } from "@/lib/constants/event-categories"

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  eventDate: z.string(),
  location: z.string().min(1),
  category: z.enum(EVENT_CATEGORIES as [string, ...string[]], {
    errorMap: () => ({ message: "Please select a valid category" }),
  }),
})

export async function GET(req: Request) {
  try {
    const session = await auth()
    const allowedRoles = ["FACULTY", "REGISTRAR", "DEAN", "ADMIN"]
    
    if (!session || !session.user.role || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const events = await prisma.event.findMany({
      where: {
        eventDate: { gte: new Date() },
      },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: { eventDate: "asc" },
      take: 50,
    })

    return NextResponse.json({ events })
  } catch (error: any) {
    console.error("Error in events GET route:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    const allowedRoles = ["FACULTY", "REGISTRAR", "DEAN", "ADMIN"]
    
    if (!session || !session.user.role || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validated = createEventSchema.parse(body)

    // Generate slug from title
    const slug = validated.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const event = await prisma.event.create({
      data: {
        title: validated.title,
        description: validated.description,
        slug: `${slug}-${Date.now()}`,
        eventDate: new Date(validated.eventDate),
        location: validated.location,
        category: validated.category,
        createdById: session.user.id!,
        status: "UPCOMING",
      },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    })

    return NextResponse.json({ event })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error in events POST route:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}



