/**
 * Get the appropriate dashboard URL based on user role
 */
export function getDashboardUrl(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin"
    case "FACULTY":
      return "/dashboard/faculty"
    case "ALUMNI":
      return "/dashboard"
    default:
      return "/dashboard"
  }
}


