# Supabase Connection Information

## Current Issue
The direct PostgreSQL connection is failing with "Tenant or user not found" error. This typically happens when:

1. Using the wrong connection pooler mode
2. Using an outdated password
3. Using the wrong port

## Supabase Connection Types

### 1. Direct Connection (Port 5432)
- For long-running connections
- Not recommended for serverless

### 2. Session Pooler (Port 5432)
- For interactive sessions
- Maintains session state

### 3. Transaction Pooler (Port 6543) - REQUIRED FOR PRISMA
- For serverless environments
- Each query gets its own connection
- **This is what Prisma needs!**

## Current Setup

Your app successfully uses:
- ✅ **Supabase JS Client**: Working perfectly with service role key
- ❌ **Prisma**: Needs correct DATABASE_URL with transaction pooler

## To Fix Prisma Connection

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/nrlxlcluutploehbbzkq/settings/database
2. Find the "Connection string" section
3. Select "Transaction" mode
4. Copy the connection string
5. Update your `.env` file with this URL

The URL should look like:
```
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## Why Both Prisma and Supabase?

Your app uses:
- **Prisma**: For type-safe queries in 24+ API routes
- **Supabase Client**: For real-time features and admin operations

Both are necessary and complement each other well!