import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const session = await auth()
    const allowedRoles = ["FACULTY", "ADMIN"]
    
    if (!session || !session.user.role || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const program = searchParams.get("program") || ""
    const batch = searchParams.get("batch") || ""
    const verified = searchParams.get("verified") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const exportCSV = searchParams.get("export") === "true"

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
      if (verified === "true") {
        where.userStatus = "VERIFIED"
      } else if (verified === "false") {
        where.userStatus = "UNVERIFIED"
      }
    }

    if (exportCSV) {
      const alumni = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          userStatus: true,
          profile: {
            select: {
              batch: true,
              degree: true,
              currentCompany: true,
              currentPosition: true,
            },
          },
          alumniProfile: {
            select: {
              verified: true,
            },
          },
        },
      })

      // Generate CSV
      const csv = [
        ["Name", "Email", "Batch", "Program", "Company", "Position", "Verified"].join(","),
        ...alumni.map((a) =>
          [
            a.name || "",
            a.email,
            a.profile?.batch || "",
            a.profile?.degree || "",
            a.profile?.currentCompany || "",
            a.profile?.currentPosition || "",
            a.userStatus === "VERIFIED" ? "Yes" : "No",
          ].join(",")
        ),
      ].join("\n")

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="alumni-directory-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    const [alumni, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          userStatus: true,
          profile: {
            select: {
              batch: true,
              degree: true,
              currentCompany: true,
              currentPosition: true,
            },
          },
          alumniProfile: {
            select: {
              verified: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ alumni, total })
  } catch (error: any) {
    console.error("Error in directory route:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}


