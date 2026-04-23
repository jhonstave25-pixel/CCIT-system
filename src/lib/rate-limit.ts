"use server"

import { prisma } from "@/lib/prisma"

// Simple in-memory rate limiting (resets on server restart)
// For production, use Redis or database-based rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now()
  const stored = rateLimitStore.get(key)

  if (!stored || now > stored.resetTime) {
    // Reset or create new entry
    const resetTime = now + config.windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: config.maxAttempts - 1, resetTime }
  }

  if (stored.count >= config.maxAttempts) {
    return { allowed: false, remaining: 0, resetTime: stored.resetTime }
  }

  stored.count++
  return { allowed: true, remaining: config.maxAttempts - stored.count, resetTime: stored.resetTime }
}

// Track failed login attempts per email
const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil?: number }>()

const LOCKOUT_DURATION = 30 * 60 * 1000 // 30 minutes
const MAX_FAILED_ATTEMPTS = 5
const ATTEMPT_WINDOW = 15 * 60 * 1000 // 15 minutes

export async function trackFailedLogin(email: string): Promise<{ locked: boolean; lockedUntil?: number; remainingAttempts: number }> {
  const now = Date.now()
  const key = email.toLowerCase()
  const stored = loginAttempts.get(key)

  if (!stored || (now - stored.lastAttempt) > ATTEMPT_WINDOW) {
    // Reset or new entry
    loginAttempts.set(key, { count: 1, lastAttempt: now })
    return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - 1 }
  }

  // Check if already locked
  if (stored.lockedUntil && now < stored.lockedUntil) {
    return { locked: true, lockedUntil: stored.lockedUntil, remainingAttempts: 0 }
  }

  stored.count++
  stored.lastAttempt = now

  // Lock account if max attempts reached
  if (stored.count >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_DURATION
    stored.lockedUntil = lockedUntil
    loginAttempts.set(key, stored)
    return { locked: true, lockedUntil, remainingAttempts: 0 }
  }

  loginAttempts.set(key, stored)
  return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - stored.count }
}

export async function clearFailedAttempts(email: string): Promise<void> {
  loginAttempts.delete(email.toLowerCase())
}

export async function isAccountLocked(email: string): Promise<{ locked: boolean; lockedUntil?: number }> {
  const key = email.toLowerCase()
  const stored = loginAttempts.get(key)
  const now = Date.now()

  if (!stored || !stored.lockedUntil) {
    return { locked: false }
  }

  if (now >= stored.lockedUntil) {
    // Lock expired, clear it
    loginAttempts.delete(key)
    return { locked: false }
  }

  return { locked: true, lockedUntil: stored.lockedUntil }
}
