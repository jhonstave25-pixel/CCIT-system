import nodemailer from "nodemailer"

// Create reusable transporter with Brevo SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  secure: process.env.EMAIL_SERVER_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER, // Your Brevo login email
    pass: process.env.EMAIL_SERVER_PASSWORD, // Your Brevo SMTP Master Password (not account password)
  },
})

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter error:", error)
  } else {
    console.log("Email server is ready to send messages")
  }
})

export async function sendVerificationEmail(to: string, url: string) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: "Verify your email address",
    html: `
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
            © ${new Date().getFullYear()} Alumni Management System. All rights reserved.
          </div>
        </body>
      </html>
    `,
    text: `Verify your email address\n\nClick this link to verify your email: ${url}\n\nThis link will expire in 10 minutes.`,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Verification email sent:", info.messageId)
    return { success: true }
  } catch (error) {
    console.error("Error sending verification email:", error)
    throw error
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: "Welcome to Alumni Management System",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome to Alumni Network!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">Hello ${name}! 👋</h2>
            <p>
              Welcome to the Alumni Management System! We&apos;re excited to have you as part of our community.
            </p>
            <p>Here&apos;s what you can do now:</p>
            <ul>
              <li>Complete your profile with your academic and professional information</li>
              <li>Connect with fellow alumni from your batch</li>
              <li>Explore upcoming events and reunions</li>
              <li>Browse the job board for career opportunities</li>
              <li>Share your achievements and success stories</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/profile" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Complete Your Profile
              </a>
            </div>
            <p>
              If you have any questions, feel free to reach out to our support team.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            © ${new Date().getFullYear()} Alumni Management System. All rights reserved.
          </div>
        </body>
      </html>
    `,
    text: `Welcome ${name}!\n\nThank you for joining the Alumni Management System.\n\nComplete your profile at: ${process.env.NEXTAUTH_URL}/profile`,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Welcome email sent:", info.messageId)
    return { success: true }
  } catch (error) {
    console.error("Error sending welcome email:", error)
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
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `Event Registration Confirmed: ${eventTitle}`,
    html: `
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
    text: `Event Registration Confirmed\n\nHello ${name}!\n\nYour registration for ${eventTitle} has been confirmed.\n\nDate: ${new Date(eventDate).toLocaleString()}\nLocation: ${eventLocation}\n\nView details: ${process.env.NEXTAUTH_URL}/events`,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Event registration email sent:", info.messageId)
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
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `${senderName} wants to connect with you`,
    html: `
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
    text: `Connection Request\n\n${senderName} wants to connect with you.\n\nView request: ${process.env.NEXTAUTH_URL}/connections`,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Connection request email sent:", info.messageId)
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
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `New Job Opportunity: ${jobTitle} at ${company}`,
    html: `
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
    text: `New Job Opportunity\n\n${jobTitle} at ${company}\n\nView details: ${jobUrl}`,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Job notification email sent:", info.messageId)
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
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    bcc: recipients, // Use BCC for privacy
    subject,
    html: htmlContent,
    text: textContent,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Newsletter sent:", info.messageId)
    return { success: true, messageId: info.messageId }
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

  const { subject, title, message, note } = typeMessages[type] as any

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html: `
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
            © ${new Date().getFullYear()} Alumni Management System. All rights reserved.
          </div>
        </body>
      </html>
    `,
  text: `${title}\n\n${message}\n\nYour OTP code is: ${code}\n\nThis code will expire in 10 minutes. If you didn&apos;t request this code, please ignore this email.`,
  }

  try {
    // Verify transporter before sending
    if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      throw new Error("Email configuration is missing. Please check your .env file.")
    }

    const info = await transporter.sendMail(mailOptions)
    console.log(`OTP email sent to ${to}:`, info.messageId)
    return { success: true }
  } catch (error: any) {
    console.error("Error sending OTP email:", error)
    
    // Provide more helpful error messages
    if (error.code === "EAUTH") {
      throw new Error("Email authentication failed. Please check your email credentials in .env")
    } else if (error.code === "ECONNECTION") {
      throw new Error("Could not connect to email server. Please check EMAIL_SERVER_HOST and EMAIL_SERVER_PORT")
    } else if (error.message?.includes("configuration")) {
      throw error
    } else {
      throw new Error(`Failed to send email: ${error.message || "Unknown error"}`)
    }
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string, otpCode: string) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: "Reset Your Password - CCIT CONNECT",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🔐 Password Reset</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">Hello!</h2>
            <p>
              We received a request to reset your password for your CCIT CONNECT account.
            </p>
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
              <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #667eea; margin: 0;">
                ${otpCode}
              </p>
              <p style="font-size: 12px; color: #666; margin-top: 10px;">Your password reset code</p>
            </div>
            <p>
              Use this code to reset your password. This code will expire in 10 minutes.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">
              If you didn&apos;t request a password reset, please ignore this email. Your password will remain unchanged.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            © ${new Date().getFullYear()} CCIT CONNECT. All rights reserved.
          </div>
        </body>
      </html>
    `,
  text: `Password Reset\n\nWe received a request to reset your password.\n\nYour reset code is: ${otpCode}\n\nUse this code to reset your password. This code will expire in 10 minutes.\n\nReset link: ${resetUrl}\n\nIf you didn&apos;t request a password reset, please ignore this email.`,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Password reset email sent:", info.messageId)
    return { success: true }
  } catch (error) {
    console.error("Error sending password reset email:", error)
    throw error
  }
}

export default transporter

