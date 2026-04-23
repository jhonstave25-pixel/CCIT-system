import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

// Simple in-memory rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const windowMs = 60 * 60 * 1000 // 1 hour
  const maxAttempts = 3
  
  const stored = rateLimitStore.get(key)

  if (!stored || now > stored.resetTime) {
    const resetTime = now + windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: maxAttempts - 1, resetTime }
  }

  if (stored.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetTime: stored.resetTime }
  }

  stored.count++
  return { allowed: true, remaining: maxAttempts - stored.count, resetTime: stored.resetTime }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, contactNumber } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !contactNumber) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Validate firstName
    if (firstName.length < 2 || firstName.length > 60) {
      return NextResponse.json(
        { error: "First name must be between 2 and 60 characters" },
        { status: 400 }
      )
    }
    if (!/^[a-zA-Z\s-]+$/.test(firstName)) {
      return NextResponse.json(
        { error: "First name can only contain letters, spaces, and hyphens" },
        { status: 400 }
      )
    }

    // Validate lastName
    if (lastName.length < 2 || lastName.length > 60) {
      return NextResponse.json(
        { error: "Last name must be between 2 and 60 characters" },
        { status: 400 }
      )
    }
    if (!/^[a-zA-Z\s-]+$/.test(lastName)) {
      return NextResponse.json(
        { error: "Last name can only contain letters, spaces, and hyphens" },
        { status: 400 }
      )
    }

    // Validate email
    const emailValidation = isValidEmail(email)
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      )
    }

    // Validate contactNumber
    if (contactNumber.length < 10 || contactNumber.length > 11) {
      return NextResponse.json(
        { error: "Contact number must be between 10 and 11 digits" },
        { status: 400 }
      )
    }
    if (!/^[\d+\-()\s]+$/.test(contactNumber)) {
      return NextResponse.json(
        { error: "Contact number can only contain numbers, +, -, (, ), and spaces" },
        { status: 400 }
      )
    }

    // Rate limiting
    const rateLimit = checkRateLimit(`account-request:${email.toLowerCase()}`)
    if (!rateLimit.allowed) {
      const minutesLeft = Math.ceil((rateLimit.resetTime - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Too many requests. Please try again in ${minutesLeft} minutes.` },
        { status: 429 }
      )
    }

    // Check if email already has a pending request
    const existingRequest = await prisma.accountRequest.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingRequest) {
      if (existingRequest.status === "PENDING") {
        return NextResponse.json(
          { error: "You already have a pending account request. Please wait for approval." },
          { status: 400 }
        )
      } else if (existingRequest.status === "APPROVED") {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in." },
          { status: 400 }
        )
      }
      // If REJECTED, allow them to submit again
    }

    // Check if contact number is already used by a different email
    const existingContactNumber = await prisma.accountRequest.findFirst({
      where: {
        contactNumber: contactNumber.trim(),
        email: {
          not: email.toLowerCase(),
        },
      },
    })

    if (existingContactNumber) {
      return NextResponse.json(
        { error: "This contact number is already associated with another email address. Please use a different contact number or sign in with your existing account." },
        { status: 400 }
      )
    }

    // Check if contact number is already used by an existing user
    const existingUserWithContact = await prisma.user.findFirst({
      where: { contactNumber: contactNumber.trim() },
    })

    if (existingUserWithContact) {
      return NextResponse.json(
        { error: "This contact number is already registered to an existing account. Please sign in or use a different contact number." },
        { status: 400 }
      )
    }

    // Check if email already registered as a user
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 400 }
      )
    }

    // Create account request
    const accountRequest = await prisma.accountRequest.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        contactNumber: contactNumber.trim(),
        status: "PENDING",
      },
    })

    return NextResponse.json(
      { 
        success: true, 
        message: "Account request submitted successfully",
        requestId: accountRequest.id 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating account request:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to submit account request: ${errorMessage}` },
      { status: 500 }
    )
  }
}
