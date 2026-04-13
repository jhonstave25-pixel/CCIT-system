# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/alumni_db"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32

   # Email (using Gmail as example)
   EMAIL_SERVER_HOST="smtp.gmail.com"
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER="your-email@gmail.com"
   EMAIL_SERVER_PASSWORD="your-app-password"  # Gmail App Password, not regular password
   EMAIL_FROM="Alumni System <noreply@alumni.com>"

   # Pusher (for real-time chat - FREE tier available)
   # Get credentials from: https://dashboard.pusher.com/
   PUSHER_APP_ID="your_app_id"
   PUSHER_KEY="your_key"
   PUSHER_SECRET="your_secret"
   PUSHER_CLUSTER="ap1"  # or us2, eu, etc.

   # Public Pusher keys (safe to expose to browser)
   NEXT_PUBLIC_PUSHER_KEY="your_key"
   NEXT_PUBLIC_PUSHER_CLUSTER="ap1"
   ```

3. **Set Up Database**
   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev --name init

   # Seed database (creates admin user)
   npx prisma db seed
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   - Visit [http://localhost:3000](http://localhost:3000)

## Email Setup (Gmail Example)

1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account → Security → App passwords
3. Generate a new app password for "Mail"
4. Use this app password in `EMAIL_SERVER_PASSWORD` (not your regular Gmail password)

## Database Setup

### Using PostgreSQL Locally

1. Install PostgreSQL
2. Create a database:
   ```sql
   CREATE DATABASE alumni_db;
   ```
3. Update `DATABASE_URL` in `.env`

### Using a Cloud Database

You can use services like:
- **Neon** (https://neon.tech) - Free PostgreSQL
- **Supabase** (https://supabase.com) - Free PostgreSQL
- **Railway** (https://railway.app) - Free PostgreSQL

Just update the `DATABASE_URL` in your `.env` file with the connection string provided by the service.

## Pusher Setup (Real-time Chat)

Pusher is **FREE** for testing! The Sandbox plan includes:
- ✅ 200,000 messages per day
- ✅ 100 concurrent connections
- ✅ Unlimited channels

### Quick Setup:

1. **Sign up** at [Pusher Dashboard](https://dashboard.pusher.com/accounts/sign_up) (free account)

2. **Create a new app**:
   - Click "Create app" or "Channels apps" → "Create app"
   - Name: `CCIT-Connect` (or any name)
   - Cluster: Choose closest to you (e.g., `ap1` for Asia, `us2` for US, `eu` for Europe)
   - Front-end: React
   - Back-end: Node.js

3. **Copy your credentials** from the "App Keys" tab:
   - App ID
   - Key
   - Secret
   - Cluster

4. **Add to `.env` file**:
   ```env
   PUSHER_APP_ID=your_app_id_here
   PUSHER_KEY=your_key_here
   PUSHER_SECRET=your_secret_here
   PUSHER_CLUSTER=ap1

   NEXT_PUBLIC_PUSHER_KEY=your_key_here
   NEXT_PUBLIC_PUSHER_CLUSTER=ap1
   ```

5. **Restart your dev server**:
   ```bash
   npm run dev
   ```

**Note**: If Pusher is not configured, the chat will still work but will use polling (checking every 3 seconds) instead of real-time updates.

For detailed instructions, see [PUSHER_SETUP.md](./PUSHER_SETUP.md)

## First Admin User

After running the seed script, you can log in with:
- **Email**: `admin@alumni.com`
- Use the email magic link to sign in

Note: You may want to change this email to your own in `prisma/seed.ts` before running the seed.

## Troubleshooting

### Prisma Client Not Generated
```bash
npx prisma generate
```

### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Check that PostgreSQL is running
- Ensure the database exists

### Email Not Sending
- Verify email credentials in `.env`
- For Gmail, ensure you're using an App Password, not your regular password
- Check that 2FA is enabled on your Gmail account
- Check server logs for email errors

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## Next Steps

1. Customize the seed data in `prisma/seed.ts`
2. Update branding and colors in `tailwind.config.ts`
3. Configure your email templates in `src/lib/email.ts`
4. Set up file upload service (Cloudinary, AWS S3, etc.) if needed
5. Deploy to Vercel or your preferred hosting platform

