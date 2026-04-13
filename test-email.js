// Quick test script to verify email configuration
// Run with: node test-email.js

require('dotenv').config()
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: process.env.EMAIL_SERVER_PORT === "465",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

console.log('Testing email configuration...')
console.log('Host:', process.env.EMAIL_SERVER_HOST)
console.log('Port:', process.env.EMAIL_SERVER_PORT)
console.log('User:', process.env.EMAIL_SERVER_USER)
console.log('Password:', process.env.EMAIL_SERVER_PASSWORD ? '***' : 'NOT SET')
console.log('From:', process.env.EMAIL_FROM)
console.log('')

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:')
    console.error(error)
    
    if (error.code === 'EAUTH') {
      console.error('\n💡 Tip: Check your email credentials. For Gmail, use an App Password.')
      console.error('   Get an App Password: https://myaccount.google.com/apppasswords')
    } else if (error.code === 'ECONNECTION') {
      console.error('\n💡 Tip: Check your EMAIL_SERVER_HOST and EMAIL_SERVER_PORT')
    }
  } else {
    console.log('✅ Email server is ready!')
    console.log('\nSending test email...')
    
    // Determine recipient email
    // For Resend, EMAIL_SERVER_USER is "resend", so we need to extract email from EMAIL_FROM
    // For other providers, EMAIL_SERVER_USER is usually the email
    let recipientEmail = process.env.EMAIL_SERVER_USER
    
    // If using Resend, extract email from EMAIL_FROM (format: "Name <email@domain.com>" or "email@domain.com")
    if (process.env.EMAIL_SERVER_HOST?.includes('resend.com')) {
      const fromMatch = process.env.EMAIL_FROM?.match(/<(.+)>/) || process.env.EMAIL_FROM?.match(/([\w\.-]+@[\w\.-]+\.\w+)/)
      if (fromMatch) {
        recipientEmail = fromMatch[1] || fromMatch[0]
        console.log('Using Resend - extracting recipient from EMAIL_FROM:', recipientEmail)
      } else {
        console.error('❌ Could not extract email from EMAIL_FROM. Please set a valid email address.')
        console.error('   EMAIL_FROM format should be: "Name <email@domain.com>" or "email@domain.com"')
        process.exit(1)
      }
    }
    
    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.error('❌ No valid recipient email found!')
      console.error('   For Resend: Make sure EMAIL_FROM contains a valid email address')
      console.error('   For other providers: Make sure EMAIL_SERVER_USER is your email address')
      process.exit(1)
    }
    
    // Send test email
    transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: recipientEmail,
      subject: 'Test Email from Alumni System',
      text: 'This is a test email. If you receive this, your email configuration is working!',
      html: '<p>This is a test email. If you receive this, your email configuration is working!</p>',
    }, (err, info) => {
      if (err) {
        console.error('❌ Failed to send test email:', err)
        if (err.code === 'EENVELOPE') {
          console.error('\n💡 Tip: Make sure EMAIL_FROM contains a valid email address')
          console.error('   For Resend: EMAIL_FROM should be a verified domain/email')
        }
      } else {
        console.log('✅ Test email sent successfully!')
        console.log('Message ID:', info.messageId)
        console.log('Check your inbox:', recipientEmail)
      }
    })
  }
})

