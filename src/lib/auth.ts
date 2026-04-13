import NextAuth from "next-auth"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user) {
          return null
        }

        // ADMIN - temporarily allow password login for testing
        // TODO: Re-enable OTP-only login for admins after testing
        if (user.role === "ADMIN") {
          // Temporarily allow password login for admins
          if (!credentials.password) {
            return null
          }
          if (!user.password) {
            return null
          }
          
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )
          if (!isPasswordValid) {
            return null
          }
        } else {
          // FACULTY and ALUMNI must provide password
          if (!credentials.password) {
            return null
          }
          if (!user.password) {
            return null
          }

          // Email verification check temporarily disabled for testing
          // TODO: Re-enable email verification check after testing
          // if (!user.emailVerified) {
          //   return null // Email not verified, user must verify first
          // }

          // Check if ALUMNI is unverified - block login
          if (user.role === "ALUMNI" && user.userStatus === "UNVERIFIED") {
            throw new Error("UNVERIFIED_ACCOUNT")
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )
          if (!isPasswordValid) {
            return null
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          status: user.status,
          userStatus: user.userStatus,
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      // JWT strategy - only token is available
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as any
        session.user.status = token.status as any
        session.user.userStatus = token.userStatus as any
      }
      return session
    },
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.status = (user as any).status
        token.userStatus = (user as any).userStatus
      }
      return token
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// NextAuth v5: export auth function
export const { handlers, auth } = NextAuth(authOptions)
