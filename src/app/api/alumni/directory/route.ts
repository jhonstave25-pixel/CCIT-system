import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    let session
    try {
      session = await auth()
    } catch (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const program = searchParams.get("program") || ""
    const batch = searchParams.get("batch") || ""
    const verified = searchParams.get("verified") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")

    const where: any = {
      role: "ALUMNI",
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ]
    }

    if (program) {
      where.profile = {
        ...where.profile,
        degree: { contains: program, mode: "insensitive" },
      }
    }

    if (batch) {
      where.profile = {
        ...where.profile,
        batch: { contains: batch, mode: "insensitive" },
      }
    }

    if (verified !== "") {
      if (verified === "VERIFIED") {
        where.userStatus = "VERIFIED"
      } else if (verified === "UNVERIFIED") {
        where.userStatus = "UNVERIFIED"
      }
    }

    try {
      const [alumni, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            userStatus: true,
            profile: {
              select: {
                batch: true,
                degree: true,
                major: true,
                currentCompany: true,
                currentPosition: true,
                graduationYear: true,
                linkedinUrl: true,
                githubUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ])

      return NextResponse.json({ alumni, total })
    } catch (dbError: any) {
      // If userStatus field doesn't exist (migration not run), fallback to default behavior
      if (dbError.message?.includes("userStatus") || dbError.code === "P2009") {
        console.warn("userStatus field not found, using default query. Please run migration.")
        // Remove userStatus from where clause and select
        delete where.userStatus
        const [alumni, total] = await Promise.all([
          prisma.user.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              profile: {
                select: {
                  batch: true,
                  degree: true,
                  major: true,
                  currentCompany: true,
                  currentPosition: true,
                  graduationYear: true,
                  linkedinUrl: true,
                  githubUrl: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.user.count({ where }),
        ])
        // Map results to include default userStatus
        const alumniWithStatus = alumni.map((alum) => ({
          ...alum,
          userStatus: "UNVERIFIED" as const,
        }))
        return NextResponse.json({ alumni: alumniWithStatus, total })
      }
      throw dbError
    }
  } catch (error: any) {
    console.error("Error in alumni directory route:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

