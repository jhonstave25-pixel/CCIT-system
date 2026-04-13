import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  // Skip middleware for API routes (especially auth routes)
  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAdmin = token?.role === "ADMIN"
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")
  const isPendingApprovalPage = req.nextUrl.pathname === "/pending-approval"
  const isLoginPage = req.nextUrl.pathname === "/login"
  const isRegisterPage = req.nextUrl.pathname === "/register"
  
  // Check for job/event detail pages (protected routes)
  const isJobDetailPage = req.nextUrl.pathname.startsWith("/jobs/") && req.nextUrl.pathname !== "/jobs"
  const isEventDetailPage = req.nextUrl.pathname.startsWith("/events/") && req.nextUrl.pathname !== "/events"
  
  // Allow access to job/event listing pages, but protect detail pages
  const isDetailPage = isJobDetailPage || isEventDetailPage

  const isProtectedRoute = 
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/profile") ||
    req.nextUrl.pathname.startsWith("/admin") ||
    isDetailPage || // Protect detail pages
    req.nextUrl.pathname.startsWith("/messages")

  // Check if faculty user is pending approval
  const isFacultyPending = token?.role === "FACULTY" && token?.status !== "APPROVED"

  // Check if alumni is unverified
  const isAlumniUnverified = token?.role === "ALUMNI" && token?.userStatus === "UNVERIFIED"

  // Redirect pending faculty away from protected routes (except pending-approval, login, register)
  if (isFacultyPending && isProtectedRoute && !isPendingApprovalPage && !isLoginPage && !isRegisterPage) {
    return NextResponse.redirect(new URL("/pending-approval", req.url))
  }

  // Redirect unverified alumni away from protected routes (except login, register)
  if (isAlumniUnverified && isProtectedRoute && !isLoginPage && !isRegisterPage) {
    return NextResponse.redirect(new URL("/pending-approval", req.url))
  }

  // Redirect approved faculty away from pending-approval page
  if (token?.role === "FACULTY" && token?.status === "APPROVED" && isPendingApprovalPage) {
    return NextResponse.redirect(new URL("/dashboard/faculty", req.url))
  }

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    const callbackUrl = req.nextUrl.pathname + req.nextUrl.search
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, req.url))
  }

  // Protect job/event detail pages - require ALUMNI, ADMIN, or FACULTY role
  if (isDetailPage && token) {
    const role = token?.role
    const allowedRoles = ["ALUMNI", "ADMIN", "FACULTY"]
    if (!role || !allowedRoles.includes(role)) {
      const callbackUrl = req.nextUrl.pathname + req.nextUrl.search
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, req.url))
    }
  }

  // Redirect non-admin users trying to access admin routes
  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

