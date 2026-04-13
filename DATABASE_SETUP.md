# Database Setup Commands

## Step 1: Create the Database

First, you need to create the `ccitconnect` database. You have two options:

### Option A: Using psql (PostgreSQL command line)

```bash
# Connect to PostgreSQL (replace user/password with your PostgreSQL credentials)
psql -U postgres -h localhost

# Then run this SQL command:
CREATE DATABASE ccitconnect;

# Exit psql
\q
```

### Option B: Using PowerShell (if psql is in PATH)

```powershell
# Set environment variable for PostgreSQL connection
$env:PGPASSWORD="your_password"

# Create database
psql -U postgres -h localhost -c "CREATE DATABASE ccitconnect;"
```

### Option C: Connect to default 'postgres' database and create

If your DATABASE_URL uses `user:password`, you can temporarily connect to the default `postgres` database:

```powershell
# Update .env temporarily to use 'postgres' database
# Change: DATABASE_URL="postgresql://user:password@localhost:5432/postgres?schema=public"
# Then run: npx prisma db execute --stdin
# And paste: CREATE DATABASE ccitconnect;
# Then change back to: DATABASE_URL="postgresql://user:password@localhost:5432/ccitconnect?schema=public"
```

## Step 2: Generate Prisma Client

```bash
npx prisma generate
```

## Step 3: Run Migrations

### For Development (creates migration files):
```bash
npx prisma migrate dev
```

### OR Use the npm script:
```bash
npm run migrate
```

### For Production (applies existing migrations):
```bash
npx prisma migrate deploy
```

### OR Use the npm script:
```bash
npm run migrate:deploy
```

## Step 4: (Optional) Seed the Database

```bash
npx prisma db seed
```

## Alternative: Push Schema Without Migrations

If you want to push the schema directly without creating migration files:

```bash
npx prisma db push
```

**Note:** `db push` is useful for prototyping but doesn't create migration files. Use `migrate dev` for proper version control.

## Verify Database Connection

```bash
# Open Prisma Studio to view your database
npx prisma studio

# OR use the npm script:
npm run studio
```

## Troubleshooting

### If database creation fails:
1. Make sure PostgreSQL is running
2. Check your PostgreSQL credentials in `.env`
3. Ensure the user has permission to create databases

### If migrations fail:
1. Check that the database exists
2. Verify `DATABASE_URL` in `.env` is correct
3. Make sure Prisma Client is generated: `npx prisma generate`

### Reset database (WARNING: Deletes all data):
```bash
npx prisma migrate reset
```

