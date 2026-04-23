// Brevo Email Service - Using REST API
const BREVO_API_KEY = process.env.BREVO_API_KEY
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "noreply@ccit-connect.com"
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "CCIT CONNECT"
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

interface BrevoEmailPayload {
  sender: {
    name: string
    email: string
  }
  to: Array<{
    email: string
    name?: string
  }>
  bcc?: Array<{
    email: string
    name?: string
  }>
  subject: string
  htmlContent?: string
  textContent?: string
}

async function sendBrevoEmail(payload: BrevoEmailPayload): Promise<{ messageId?: string }> {
  if (!BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured. Please check your .env file.")
  }

  // Debug: Log API key format (masked)
  console.log("BREVO_API_KEY configured:", BREVO_API_KEY.substring(0, 20) + "...")
  console.log("BREVO_API_KEY length:", BREVO_API_KEY.length)

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Brevo API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      )
    }

    const data = await response.json()
    console.log("Email sent via Brevo API:", data.messageId)
    return { messageId: data.messageId }
  } catch (error) {
    console.error("Error sending email via Brevo API:", error)
    throw error
  }
}

export async function sendVerificationEmail(to: string, url: string) {
  const payload: BrevoEmailPayload = {
    sender: {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL,
    },
    to: [{ email: to }],
    subject: "Verify your email address",
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Alumni Management System</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">Verify Your Email Address</h2>
            <p>
              Thank you for registering! Please click the button below to verify your email address and complete your registration.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">
              Or copy and paste this link into your browser:
              <br>
              <a href="${url}" style="color: #667eea;">${url}</a>
            </p>
            <p style="font-size: 14px; color: #666;">
              This link will expire in 10 minutes. If you didn&apos;t request this email, you can safely ignore it.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            &copy; ${new Date().getFullYear()} Alumni Management System. All rights reserved.
          </div>
        </body>
      </html>
    `,
    textContent: `Verify your email address\n\nClick this link to verify your email: ${url}\n\nThis link will expire in 10 minutes.`,
  }

  try {
    await sendBrevoEmail(payload)
    return { success: true }
  } catch (error) {
    console.error("Error sending verification email:", error)
    throw error
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  const payload: BrevoEmailPayload = {
    sender: {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL,
    },
    to: [{ email: to, name }],
    subject: "Welcome to CCIT CONNECT - Your Alumni Journey Begins!",
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to CCIT CONNECT</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome to CCIT CONNECT!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">Hello ${name}! 👋</h2>
            <p>
              Welcome to CCIT CONNECT! We&apos;re thrilled to have you join our alumni community.
            </p>
            <p><strong>Here&apos;s what you can do now:</strong></p>
            <ul style="color: #333; margin: 20px 0;">
              <li>Complete your profile with your academic and professional information</li>
              <li>Connect with fellow alumni from your batch</li>
              <li>Explore upcoming events and reunions</li>
              <li>Browse the job board for career opportunities</li>
              <li>Share your achievements and success stories</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/profile" style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Complete Your Profile
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">
              If you have any questions, feel free to reach out to our support team.
            </p>
            <p style="font-size: 14px; color: #666;">
              Welcome aboard!
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            &copy; ${new Date().getFullYear()} CCIT CONNECT. All rights reserved.
          </div>
        </body>
      </html>
    `,
    textContent: `Welcome to CCIT CONNECT!\n\nHello ${name}!\n\nWelcome to CCIT CONNECT! We're thrilled to have you join our alumni community.\n\nHere's what you can do now:\n- Complete your profile with your academic and professional information\n- Connect with fellow alumni from your batch\n- Explore upcoming events and reunions\n- Browse the job board for career opportunities\n- Share your achievements and success stories\n\nComplete your profile: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/profile\n\nIf you have any questions, feel free to reach out to our support team.\n\nWelcome aboard!\n\n© ${new Date().getFullYear()} CCIT CONNECT. All rights reserved.`,
  }

  try {
    await sendBrevoEmail(payload)
    return { success: true }
  } catch (error) {
    console.error("Error sending welcome email:", error)
    throw error
  }
}

export async function sendAccountApprovedEmail(
  to: string,
  name: string,
  generatedPassword: string
) {
  const payload: BrevoEmailPayload = {
    sender: {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL,
    },
    to: [{ email: to, name }],
    subject: "Your CCIT CONNECT Account Has Been Created!",
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Created - CCIT CONNECT</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Your Account is Ready!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">Hello ${name}! 🎉</h2>
            <p>
              Great news! Your account request has been approved and your CCIT CONNECT account has been created.
            </p>
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0 0 10px 0;"><strong>Your login credentials:</strong></p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${to}</p>
              <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${generatedPassword}</code></p>
            </div>
            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>Important:</strong> For security reasons, please change your password immediately after logging in.
              </p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login" style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Login Now
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">
              <strong>What you can do next:</strong>
            </p>
            <ul style="color: #333; margin: 10px 0; font-size: 14px;">
              <li>Complete your profile with your academic and professional information</li>
              <li>Connect with fellow alumni from your batch</li>
              <li>Explore upcoming events and reunions</li>
              <li>Browse the job board for career opportunities</li>
            </ul>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              If you have any questions, feel free to reach out to our support team.
            </p>
            <p style="font-size: 14px; color: #666;">
              Welcome to the CCIT CONNECT community!
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            &copy; ${new Date().getFullYear()} CCIT CONNECT. All rights reserved.
          </div>
        </body>
      </html>
    `,
    textContent: `Your CCIT CONNECT Account Has Been Created!

Hello ${name}!

Great news! Your account request has been approved and your CCIT CONNECT account has been created.

Your login credentials:
Email: ${to}
Password: ${generatedPassword}

IMPORTANT: For security reasons, please change your password immediately after logging in.

Login here: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login

What you can do next:
- Complete your profile with your academic and professional information
- Connect with fellow alumni from your batch
- Explore upcoming events and reunions
- Browse the job board for career opportunities

If you have any questions, feel free to reach out to our support team.

Welcome to the CCIT CONNECT community!

© ${new Date().getFullYear()} CCIT CONNECT. All rights reserved.`,
  }

  try {
    await sendBrevoEmail(payload)
    return { success: true }
  } catch (error) {
    console.error("Error sending account approved email:", error)
    throw error
  }
}

export async function sendEventRegistrationEmail(
  to: string,
  name: string,
  eventTitle: string,
  eventDate: Date,
  eventLocation: string
) {
  const payload: BrevoEmailPayload = {
    sender: {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL,
    },
    to: [{ email: to, name }],
    subject: `Event Registration Confirmed: ${eventTitle}`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Event Registration</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">✓ Registration Confirmed</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">Hello ${name}!</h2>
            <p>
              Your registration for <strong>${eventTitle}</strong> has been confirmed!
            </p>
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Event:</strong> ${eventTitle}</p>
              <p><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              <p><strong>Location:</strong> ${eventLocation}</p>
            </div>
            <p>
              We look forward to seeing you at the event! Make sure to add it to your calendar.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/events" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Event Details
              </a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            © ${new Date().getFullYear()} Alumni Management System. All rights reserved.
          </div>
        </body>
      </html>
    `,
    textContent: `Event Registration Confirmed\n\nHello ${name}!\n\nYour registration for ${eventTitle} has been confirmed.\n\nDate: ${new Date(eventDate).toLocaleString()}\nLocation: ${eventLocation}\n\nView details: ${process.env.NEXTAUTH_URL}/events`,
  }

  try {
    await sendBrevoEmail(payload)
    return { success: true }
  } catch (error) {
    console.error("Error sending event registration email:", error)
    throw error
  }
}

export async function sendConnectionRequestEmail(
  to: string,
  recipientName: string,
  senderName: string,
  senderProfile: string
) {
  const payload: BrevoEmailPayload = {
    sender: {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL,
    },
    to: [{ email: to, name: recipientName }],
    subject: `${senderName} wants to connect with you`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Connection Request</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">New Connection Request</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">Hello ${recipientName}!</h2>
            <p>
              <strong>${senderName}</strong> would like to connect with you on the Alumni Network.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/connections" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Request
              </a>
            </div>
            <p>
              Building meaningful connections helps strengthen our alumni community!
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            © ${new Date().getFullYear()} Alumni Management System. All rights reserved.
          </div>
        </body>
      </html>
    `,
    textContent: `Connection Request\n\n${senderName} wants to connect with you.\n\nView request: ${process.env.NEXTAUTH_URL}/connections`,
  }

  try {
    await sendBrevoEmail(payload)
    return { success: true }
  } catch (error) {
    console.error("Error sending connection request email:", error)
    throw error
  }
}

export async function sendJobNotificationEmail(
  to: string,
  name: string,
  jobTitle: string,
  company: string,
  jobUrl: string
) {
  const payload: BrevoEmailPayload = {
    sender: {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL,
    },
    to: [{ email: to, name }],
    subject: `New Job Opportunity: ${jobTitle} at ${company}`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Job Notification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">💼 New Job Opportunity</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">Hello ${name}!</h2>
            <p>
              A new job opportunity matching your profile has been posted:
            </p>
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p style="font-size: 18px; font-weight: bold;">${jobTitle}</p>
              <p><strong>Company:</strong> ${company}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${jobUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Job Details
              </a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            © ${new Date().getFullYear()} Alumni Management System. All rights reserved.
          </div>
        </body>
      </html>
    `,
    textContent: `New Job Opportunity\n\n${jobTitle} at ${company}\n\nView details: ${jobUrl}`,
  }

  try {
    await sendBrevoEmail(payload)
    return { success: true }
  } catch (error) {
    console.error("Error sending job notification email:", error)
    throw error
  }
}

// Newsletter function
export async function sendNewsletterEmail(
  recipients: string[],
  subject: string,
  htmlContent: string,
  textContent: string
) {
  const payload: BrevoEmailPayload = {
    sender: {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL,
    },
    to: [{ email: BREVO_SENDER_EMAIL }], // Use sender as primary recipient
    bcc: recipients.map(email => ({ email })), // Use BCC for privacy
    subject,
    htmlContent,
    textContent,
  }

  try {
    const result = await sendBrevoEmail(payload)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("Error sending newsletter:", error)
    throw error
  }
}

export async function sendOTPEmail(
  to: string,
  code: string,
  type: "LOGIN" | "REGISTER" | "RESET_PASSWORD"
) {
  const typeMessages = {
    LOGIN: {
      subject: "Your Login OTP Code",
      title: "Login Verification",
      message: "Use this code to log in to your account:",
    },
    REGISTER: {
      subject: "Verify Your CCIT Alumni Account",
      title: "Registration Verification",
      message: "Use this code to complete your registration:",
      note: "This code is valid for 10 minutes and will only be required once.",
    },
    RESET_PASSWORD: {
      subject: "Your Password Reset OTP Code",
      title: "Password Reset",
      message: "Use this code to reset your password:",
    },
  }

  const { subject, title, message, note } = typeMessages[type] as { subject: string; title: string; message: string; note?: string }

  const payload: BrevoEmailPayload = {
    sender: {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL,
    },
    to: [{ email: to }],
    subject,
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Alumni Management System</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">${title}</h2>
            <p>${message}</p>
            <div style="background: white; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0;">
              <h1 style="color: #667eea; font-size: 48px; letter-spacing: 10px; margin: 0; font-family: 'Courier New', monospace;">${code}</h1>
            </div>
            <p style="font-size: 14px; color: #666;">
              This code will expire in 10 minutes. If you didn&apos;t request this code, please ignore this email.
            </p>
            ${note ? `<p style="font-size: 14px; color: #667eea; font-weight: bold;">${note}</p>` : ''}
            <p style="font-size: 14px; color: #666;">
              For security reasons, never share this code with anyone.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            &copy; ${new Date().getFullYear()} Alumni Management System. All rights reserved.
          </div>
        </body>
      </html>
    `,
    textContent: `${title}\n\n${message}\n\nYour OTP code is: ${code}\n\nThis code will expire in 10 minutes. If you didn&apos;t request this code, please ignore this email.`,
  }

  try {
    // Verify API key before sending
    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is not configured. Please check your .env file.")
    }

    await sendBrevoEmail(payload)
    console.log(`OTP email sent to ${to}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error sending OTP email:", error)
    throw new Error(`Failed to send email: ${error.message || "Unknown error"}`)
  }
}

export async function sendPasswordResetEmail(to: string, otpCode: string) {
  const payload: BrevoEmailPayload = {
    sender: {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL,
    },
    to: [{ email: to }],
    subject: "Your Password Reset OTP - CCIT CONNECT",
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset OTP - CCIT CONNECT</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Password Reset Code</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">Hello!</h2>
            <p>
              We received a request to reset your password for your CCIT CONNECT account.
            </p>
            <p><strong>Your password reset code is:</strong></p>
            <div style="background: white; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0;">
              <h1 style="color: #667eea; font-size: 48px; letter-spacing: 10px; margin: 0; font-family: 'Courier New', monospace;">${otpCode}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">
              This code expires in 10 minutes. Enter this code on the forgot password page to reset your password.
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              If you didn&apos;t request a password reset, please ignore this email. Your password will remain unchanged.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            &copy; ${new Date().getFullYear()} CCIT CONNECT. All rights reserved.
          </div>
        </body>
      </html>
    `,
    textContent: `Password Reset OTP - CCIT CONNECT\n\nHello!\n\nWe received a request to reset your password for your CCIT CONNECT account.\n\nYour password reset code is: ${otpCode}\n\nThis code expires in 10 minutes. Enter this code on the forgot password page to reset your password.\n\nIf you didn't request a password reset, please ignore this email. Your password will remain unchanged.\n\n© ${new Date().getFullYear()} CCIT CONNECT. All rights reserved.`,
  }

  try {
    await sendBrevoEmail(payload)
    return { success: true }
  } catch (error) {
    console.error("Error sending password reset email:", error)
    throw error
  }
}

export async function sendVerificationNotificationEmail(to: string, name: string) {
  const payload: BrevoEmailPayload = {
    sender: {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL,
    },
    to: [{ email: to, name }],
    subject: "Your Account Has Been Verified - CCIT CONNECT",
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Verified - CCIT CONNECT</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Account Verified!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">Hello ${name}!</h2>
            <p>
              Great news! Your CCIT CONNECT account has been verified by our faculty/admin team.
            </p>
            <p>
              You can now log in and access all features of the alumni platform, including:
            </p>
            <ul style="color: #333; margin: 20px 0;">
              <li>Connecting with fellow alumni</li>
              <li>Viewing and posting job opportunities</li>
              <li>Participating in events and reunions</li>
              <li>Accessing exclusive alumni resources</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login" style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Log In Now
              </a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              If you have any questions or need assistance, feel free to reach out to our support team.
            </p>
            <p style="font-size: 14px; color: #666;">
              Welcome to the CCIT Alumni Network!
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            &copy; ${new Date().getFullYear()} CCIT CONNECT. All rights reserved.
          </div>
        </body>
      </html>
    `,
    textContent: `Account Verified - CCIT CONNECT\n\nHello ${name}!\n\nGreat news! Your CCIT CONNECT account has been verified by our faculty/admin team.\n\nYou can now log in and access all features of the alumni platform, including:\n- Connecting with fellow alumni\n- Viewing and posting job opportunities\n- Participating in events and reunions\n- Accessing exclusive alumni resources\n\nLog in here: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login\n\nIf you have any questions or need assistance, feel free to reach out to our support team.\n\nWelcome to the CCIT Alumni Network!\n\n© ${new Date().getFullYear()} CCIT CONNECT. All rights reserved.`,
  }

  try {
    await sendBrevoEmail(payload)
    return { success: true }
  } catch (error) {
    console.error("Error sending verification notification email:", error)
    throw error
  }
}

export async function sendProfileUpdatedEmail(to: string, name: string, updateType: "profile" | "image") {
  const subject = updateType === "image" 
    ? "Your Profile Picture Has Been Updated - CCIT CONNECT"
    : "Your Profile Has Been Updated - CCIT CONNECT"
  
  const title = updateType === "image"
    ? "Profile Picture Updated"
    : "Profile Updated"

  const message = updateType === "image"
    ? "Your profile picture has been successfully updated."
    : "Your profile information has been successfully updated."

  const payload: BrevoEmailPayload = {
    sender: {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL,
    },
    to: [{ email: to, name }],
    subject,
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title} - CCIT CONNECT</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">${title}</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">Hello ${name}!</h2>
            <p>${message}</p>
            <p>
              If you did not make this change, please contact our support team immediately to secure your account.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/profile" style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                View Profile
              </a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              Thank you for keeping your profile up to date!
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            &copy; ${new Date().getFullYear()} CCIT CONNECT. All rights reserved.
          </div>
        </body>
      </html>
    `,
    textContent: `${title} - CCIT CONNECT\n\nHello ${name}!\n\n${message}\n\nIf you did not make this change, please contact our support team immediately to secure your account.\n\nView your profile: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/profile\n\nThank you for keeping your profile up to date!\n\n© ${new Date().getFullYear()} CCIT CONNECT. All rights reserved.`,
  }

  try {
    await sendBrevoEmail(payload)
    return { success: true }
  } catch (error) {
    console.error("Error sending profile updated email:", error)
    throw error
  }
}
