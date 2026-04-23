"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { sendProfileUpdatedEmail, sendWelcomeEmail } from "@/lib/email"
import { auth } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"

// List of blocked temp/fake email domains
const BLOCKED_EMAIL_DOMAINS = [
  "tempmail.com",
  "temp-mail.com",
  "fakeemail.com",
  "throwaway.com",
  "mailinator.com",
  "guerrillamail.com",
  "sharklasers.com",
  "getairmail.com",
  "10minutemail.com",
  "yopmail.com",
  "tempinbox.com",
  "mailnesia.com",
  "tempmailaddress.com",
  "burnermail.io",
  "disposable.com",
  "trashmail.com",
  "fakeinbox.com",
  "tempemail.com",
  "spamgourmet.com",
  "mytrashmail.com",
  "mailcatch.com",
  "tempmailer.com",
  "tempmail.net",
  "tmpmail.org",
  "throwawaymail.com",
  "emailfake.com",
  "tempmail.plus",
  "tempm.com",
  "mailtemp.com",
  "tempimail.com",
  "fakemail.net",
  "mohmal.com",
  "yandex.com",
  "protonmail.com",
]

function isValidEmail(email: string): { valid: boolean; error?: string } {
  const lowerEmail = email.toLowerCase()
  
  // Check if it's Gmail
  if (!lowerEmail.endsWith("@gmail.com")) {
    return { valid: false, error: "Only Gmail addresses (@gmail.com) are allowed" }
  }
  
  // Check blocked domains
  const domain = lowerEmail.split("@")[1]
  if (BLOCKED_EMAIL_DOMAINS.includes(domain)) {
    return { valid: false, error: "Temp or fake email addresses are not allowed" }
  }
  
  return { valid: true }
}

const profileSchema = z.object({
  phone: z.string().nullable().optional(),
  dateOfBirth: z.date().nullable().optional(),
  graduationYear: z.number().int().min(1950).max(2030).nullable().optional(),
  degree: z.string().nullable().optional(),
  major: z.string().nullable().optional(),
  batch: z.string().nullable().optional(),
  currentCompany: z.string().nullable().optional(),
  currentPosition: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  linkedinUrl: z.string().url().nullable().optional().or(z.literal("")),
  skills: z.array(z.string()).nullable().optional(),
})

export async function updateProfile(userId: string, data: z.infer<typeof profileSchema>) {
  try {
    const validatedData = profileSchema.parse(data)
    
    // Filter out null values to prevent Prisma errors
    const cleanData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, v]) => v !== null)
    )
    
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: cleanData,
      create: {
        userId,
        ...cleanData,
      },
    })

    // Get user info for email notification
    const session = await auth()
    if (session?.user?.email && session?.user?.name) {
      try {
        await sendProfileUpdatedEmail(session.user.email, session.user.name, "profile")
        console.log(`Profile update email sent to ${session.user.email}`)
      } catch (emailError) {
        console.warn("Failed to send profile update email:", emailError)
      }
    }

    revalidatePath("/profile")
    return { success: true, profile }
  } catch (error: any) {
    console.error("Error updating profile:", error)
    
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => i.message).join(", ")
      return { success: false, error: `Validation failed: ${issues}` }
    }
    
    return { success: false, error: error?.message || "Failed to update profile" }
  }
}

export async function createAlumniAccount(data: {
  name: string
  email: string
  password: string
  role: "ALUMNI" | "FACULTY"
  honeypot?: string
}) {
  try {
    // Honeypot check - if filled, it's likely a bot
    if (data.honeypot && data.honeypot.length > 0) {
      console.log("Honeypot triggered - possible bot registration blocked")
      return { success: false, error: "Registration failed. Please try again." }
    }

    // Rate limiting - max 3 registrations per email per hour
    const rateLimit = await checkRateLimit(`register:${data.email.toLowerCase()}`, {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
    })

    if (!rateLimit.allowed) {
      const minutesLeft = Math.ceil((rateLimit.resetTime - Date.now()) / 60000)
      return { 
        success: false, 
        error: `Too many registration attempts. Please try again in ${minutesLeft} minutes.` 
      }
    }

    // Validate email - only Gmail, no temp/fake emails
    const emailValidation = isValidEmail(data.email)
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error }
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    })

    if (existing) {
      return { success: false, error: "Email already registered" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Create user with hashed password
    // Set status to PENDING for FACULTY role, null for others
    // Set userStatus to UNVERIFIED for ALUMNI (pending Registrar verification)
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        role: data.role,
        status: data.role === "FACULTY" ? "PENDING" : null,
        userStatus: data.role === "ALUMNI" ? "UNVERIFIED" : "VERIFIED",
        emailVerified: new Date(),
      },
      include: {
        profile: true,
      },
    })

    // Create a basic profile for the user
    let profile = null
    try {
      profile = await prisma.profile.create({
        data: {
          userId: user.id,
          graduationYear: new Date().getFullYear(),
          degree: "",
          major: "",
          batch: "",
        },
      })
    } catch (profileError) {
      // Profile creation is optional, continue if it fails
      console.error("Profile creation failed (non-critical):", profileError)
    }

    // Publish real-time user creation event
    try {
      const { publishToAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } = await import("@/lib/ably")
      await publishToAblyChannel({
        channelName: ABLY_CHANNELS.USERS_UPDATE,
        eventName: ABLY_EVENTS.USER_CREATED,
        data: {
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          userStatus: user.userStatus || "UNVERIFIED",
          status: user.status,
          createdAt: user.createdAt.toISOString(),
          profile: profile,
        },
      })
    } catch (ablyError) {
      console.warn("Failed to publish user creation event to Ably:", ablyError)
      // Don't fail the request if Ably fails
    }

    // Send welcome email to new user
    try {
      await sendWelcomeEmail(user.email, user.name || "New User")
      console.log(`Welcome email sent to ${user.email}`)
    } catch (emailError) {
      console.warn("Failed to send welcome email:", emailError)
      // Don't fail the request if email fails
    }

    // OTP verification temporarily disabled - users can log in immediately
    // TODO: Re-enable OTP verification after testing

    revalidatePath("/login")
    revalidatePath("/register")
    // Revalidate landing page if creating an alumni account
    if (data.role === "ALUMNI") {
      revalidatePath("/")
    }
    return { success: true, user, requiresVerification: false }
  } catch (error: any) {
    console.error("Error creating alumni account:", error)
    return { success: false, error: error.message || "Failed to create account" }
  }
}

export async function searchAlumni(query: string, filters?: {
  graduationYear?: number
  degree?: string
  industry?: string
  batch?: string
}) {
  try {
    const where: any = {
      role: "ALUMNI",
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { profile: { major: { contains: query, mode: "insensitive" } } },
      ],
    }

    if (filters) {
      if (filters.graduationYear) {
        where.profile = { ...where.profile, graduationYear: filters.graduationYear }
      }
      if (filters.degree) {
        where.profile = { ...where.profile, degree: { contains: filters.degree, mode: "insensitive" } }
      }
      if (filters.industry) {
        where.profile = { ...where.profile, industry: { contains: filters.industry, mode: "insensitive" } }
      }
      if (filters.batch) {
        where.profile = { ...where.profile, batch: { contains: filters.batch, mode: "insensitive" } }
      }
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        profile: true,
      },
      take: 50,
    })

    return { success: true, users }
  } catch (error) {
    return { success: false, error: "Failed to search alumni" }
  }
}
