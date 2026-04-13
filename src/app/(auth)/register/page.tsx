"use client"

import { useTransition, useState, useRef, useCallback } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createAlumniAccount } from "@/actions/user.actions"
import { getDashboardUrl } from "@/lib/redirects"
import Link from "next/link"
import { Eye } from "lucide-react"

// Helper to split name into first and last
function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" }
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  }
}

const registerSchema = z
  .object({
    name: z
      .string()
      .min(3, "Full name must be at least 3 characters")
      .max(120, "Full name must be at most 120 characters")
      .regex(/^[a-zA-Z\s-]+$/, "Name can only contain letters, spaces, and hyphens"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
    role: z.enum(["ALUMNI", "FACULTY"]).default("ALUMNI"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      const { firstName, lastName } = splitName(data.name)
      return firstName.length >= 2 && firstName.length <= 60 && (lastName.length === 0 || (lastName.length >= 2 && lastName.length <= 60))
    },
    {
      message: "First and last name must each be 2-60 characters",
      path: ["name"],
    }
  )

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const passwordTimerRef = useRef<NodeJS.Timeout | null>(null)
  const confirmTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handlePasswordDown = useCallback(() => {
    passwordTimerRef.current = setTimeout(() => {
      setShowPassword(true)
    }, 200)
  }, [])

  const handlePasswordUp = useCallback(() => {
    if (passwordTimerRef.current) {
      clearTimeout(passwordTimerRef.current)
      passwordTimerRef.current = null
    }
    setShowPassword(false)
  }, [])

  const handleConfirmDown = useCallback(() => {
    confirmTimerRef.current = setTimeout(() => {
      setShowConfirmPassword(true)
    }, 200)
  }, [])

  const handleConfirmUp = useCallback(() => {
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current)
      confirmTimerRef.current = null
    }
    setShowConfirmPassword(false)
  }, [])

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "ALUMNI",
    },
  })

  const handleSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createAlumniAccount({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      })

      if (result.success) {
        toast({
          title: "Waiting for Faculty/Admin Verification",
          description: "Your account has been created and is awaiting approval. Please wait for verification before logging in.",
        })
        // Redirect all users to login page after registration
        router.push("/login")
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to create account. Please try again.",
        })
      }
    })
  })

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950 p-4">
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl shadow-lg w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-5 duration-500 border border-gray-200 dark:border-gray-800">
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 p-6 text-center">
          <h1 className="text-2xl font-semibold text-white">Create Account</h1>
          <p className="text-sm text-white/95 mt-1">Join the CCIT CONNECT</p>
        </div>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="John Doe"
                        disabled={isPending}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        placeholder="johndoe@gmail.com"
                        disabled={isPending}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          {...field}
                          placeholder="********"
                          disabled={isPending}
                          className="h-11 pr-12"
                        />
                        <button
                          type="button"
                          onMouseDown={handlePasswordDown}
                          onMouseUp={handlePasswordUp}
                          onMouseLeave={handlePasswordUp}
                          onTouchStart={handlePasswordDown}
                          onTouchEnd={handlePasswordUp}
                          className="absolute right-3 top-0 bottom-0 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors select-none"
                          aria-label="Long press to show password"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Must be at least 8 characters long</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          {...field}
                          placeholder="********"
                          disabled={isPending}
                          className="h-11 pr-12"
                        />
                        <button
                          type="button"
                          onMouseDown={handleConfirmDown}
                          onMouseUp={handleConfirmUp}
                          onMouseLeave={handleConfirmUp}
                          onTouchStart={handleConfirmDown}
                          onTouchEnd={handleConfirmUp}
                          className="absolute right-3 top-0 bottom-0 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors select-none"
                          aria-label="Long press to show password"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>I am a</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ALUMNI">Alumni</SelectItem>
                        <SelectItem value="FACULTY">Faculty</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 text-white hover:opacity-95 transition-all shadow-md hover:shadow-lg"
                disabled={isPending}
              >
                {isPending ? "Creating..." : "Create Account"}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm mt-4 text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline font-medium transition-colors">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
