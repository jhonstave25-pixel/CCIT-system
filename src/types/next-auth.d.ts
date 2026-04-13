import "next-auth"
import { Role, FacultyStatus, UserStatus } from "@prisma/client"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: Role
      status?: FacultyStatus | null
      userStatus?: UserStatus | null
    }
  }

  interface User {
    role: Role
    status?: FacultyStatus | null
    userStatus?: UserStatus | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    status?: FacultyStatus | null
    userStatus?: UserStatus | null
  }
}

