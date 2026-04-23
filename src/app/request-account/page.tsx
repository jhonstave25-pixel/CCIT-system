"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, ArrowLeft } from "lucide-react"

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

const requestSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(60, "First name must be at most 60 characters")
    .regex(/^[a-zA-Z\s-]+$/, "First name can only contain letters, spaces, and hyphens"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(60, "Last name must be at most 60 characters")
    .regex(/^[a-zA-Z\s-]+$/, "Last name can only contain letters, spaces, and hyphens"),
  email: z
    .string()
    .email("Invalid email address")
    .toLowerCase()
    .refine(
      (email) => email.endsWith("@gmail.com"),
      {
        message: "Only Gmail addresses (@gmail.com) are allowed",
      }
    )
    .refine(
      (email) => {
        const domain = email.split("@")[1]
        return !BLOCKED_EMAIL_DOMAINS.includes(domain)
      },
      {
        message: "Temp or fake email addresses are not allowed",
      }
    ),
  contactNumber: z
    .string()
    .min(10, "Contact number must be at least 10 digits")
    .max(11, "Contact number must be at most 11 digits")
    .regex(/^[\d+\-()\s]+$/, "Contact number can only contain numbers, +, -, (, ), and spaces"),
  honeypot: z.string().optional(), // Hidden field for spam detection
})

type RequestFormValues = z.infer<typeof requestSchema>

export default function RequestAccountPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      contactNumber: "",
      honeypot: "",
    },
  })

  const onSubmit = async (data: RequestFormValues) => {
    // Honeypot check
    if (data.honeypot && data.honeypot.length > 0) {
      console.log("Honeypot triggered - possible bot submission blocked")
      toast({
        title: "Error",
        description: "There was a problem submitting your request. Please try again.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/account-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          contactNumber: data.contactNumber,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: result.error || "Failed to submit request. Please try again.",
          variant: "destructive",
        })
        return
      }

      setIsSubmitted(true)
      toast({
        title: "Request Submitted",
        description: "Your account request has been submitted for review.",
      })
    } catch (error) {
      console.error("Error submitting account request:", error)
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4"
      >
        <Card className="w-full max-w-md bg-white shadow-2xl text-slate-900">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Request Submitted!</h2>
            <p className="text-slate-600 mb-6">
              Thank you for your interest. Your account request has been forwarded to the administrator for review. You will receive an email notification once your account is created.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/">
                <Button className="bg-indigo-600 text-white hover:bg-indigo-700 font-semibold">Back to Home</Button>
              </Link>
              <Link href="/login">
                <Button className="bg-indigo-600 text-white hover:bg-indigo-700">Go to Login</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-white hover:text-white/80 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>

        <Card className="w-full bg-white shadow-2xl text-slate-900">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-slate-900">Request Account</CardTitle>
            <CardDescription className="text-slate-600">
              Fill in your details below. Your request will be reviewed by the administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    {...register("firstName")}
                    disabled={isLoading}
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    {...register("lastName")}
                    disabled={isLoading}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="yourname@gmail.com"
                  {...register("email")}
                  disabled={isLoading}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
                <p className="text-xs text-slate-500">
                  Only Gmail addresses (@gmail.com) are accepted
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber">
                  Contact Number
                  <span className="text-xs text-slate-400 ml-2">(Max 11 digits)</span>
                </Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  placeholder="+63 912 345 6789"
                  maxLength={11}
                  {...register("contactNumber")}
                  disabled={isLoading}
                  className={errors.contactNumber ? "border-red-500 focus-visible:ring-red-300 focus-visible:border-red-300" : ""}
                />
                {errors.contactNumber && (
                  <div className="flex items-center gap-1 text-xs text-red-500 bg-red-50 p-2 rounded">
                    <span className="font-medium">Error:</span> {errors.contactNumber.message}
                  </div>
                )}
              </div>

              {/* Honeypot field - hidden from real users */}
              <div className="absolute opacity-0 top-0 left-0 h-0 w-0 overflow-hidden">
                <Label htmlFor="honeypot">Leave this empty</Label>
                <Input
                  id="honeypot"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  {...register("honeypot")}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Submit Request"}
              </Button>

              <div className="text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
                >
                  Sign in here
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
