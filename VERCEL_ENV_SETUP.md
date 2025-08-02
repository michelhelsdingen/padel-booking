# Vercel Environment Variables Setup

To fix the "Toegewezen 0" issue in production, you need to configure the environment variables in Vercel dashboard.

## Required Environment Variables

Go to your Vercel project → Settings → Environment Variables and add:

### Database (Supabase)
```
DATABASE_URL = postgresql://postgres.nrlxlcluutploehbbzkq:!!IQLn1kpg!!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

NEXT_PUBLIC_SUPABASE_URL = https://nrlxlcluutploehbbzkq.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHhsY2x1dXRwbG9laGJiemtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNTkwMjQsImV4cCI6MjA2OTYzNTAyNH0.2-lCT5fq3QgXxgcJFoCRi65ZvmUY5q6PZqYZdCDpN2M

SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHhsY2x1dXRwbG9laGJiemtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA1OTAyNCwiZXhwIjoyMDY5NjM1MDI0fQ.xdyh_4DnbXfGvkr6mGqpbpAdGOTkyrCeamJnPdsmNkk
```

### Email (Resend)
```
RESEND_API_KEY = re_hJzoWNMT_9iFYiaShyGEYprDVHoizSGLw
```

### Vercel Analytics
```
VERCEL_API_TOKEN = ZTtxR622Q1M55o0v2BsktlO1
VERCEL_PROJECT_ID = prj_iTjcC9grHCLkPSQ897vuJ7n717C2
```

## Steps to Add:

1. Go to https://vercel.com/dashboard
2. Find your padel-booking project
3. Go to Settings → Environment Variables
4. Add each variable above
5. Set Environment: Production, Preview, Development (or just Production)
6. Save and redeploy

## Common Issues:

- **Authentication Required page**: Environment variables not set
- **Database connection errors**: Wrong DATABASE_URL or missing Prisma connection
- **"Toegewezen 0"**: Lottery stats API can't connect to database

After setting these up, trigger a new deployment or use:
```bash
vercel --prod
```