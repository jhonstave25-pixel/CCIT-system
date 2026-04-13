import { handlers } from "@/lib/auth"

// Ensure this auth route runs in the Node runtime (not Edge) because
// the JWT implementation uses APIs not available in the Edge runtime.
export const runtime = "nodejs"

// Export GET and POST from handlers
export const { GET, POST } = handlers

