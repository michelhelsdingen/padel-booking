# Vercel Environment Variables Setup

To fix the "Toegewezen 0" issue in production, you need to configure the environment variables in Vercel dashboard.

## Required Environment Variables

Go to your Vercel project → Settings → Environment Variables and add:

### Database (Supabase)
```
DATABASE_URL = [Get from Supabase Dashboard → Settings → Database]
NEXT_PUBLIC_SUPABASE_URL = [Get from Supabase Dashboard → Settings → API]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [Get from Supabase Dashboard → Settings → API]
SUPABASE_SERVICE_ROLE_KEY = [Get from Supabase Dashboard → Settings → API - KEEP SECRET!]
```

### Email (Resend)
```
RESEND_API_KEY = [Get from Resend Dashboard]
```

### Vercel Analytics
```
VERCEL_API_TOKEN = [Get from Vercel Account Settings]
VERCEL_PROJECT_ID = [Get from Vercel Project Settings]
```

## Steps to Add:

1. Go to https://vercel.com/dashboard
2. Find your padel-booking project
3. Go to Settings → Environment Variables
4. Get the actual values from respective dashboards (DO NOT commit secrets to git)
5. Set Environment: Production, Preview, Development (or just Production)
6. Save and redeploy

## Security Note:
⚠️ **NEVER commit actual API keys or secrets to git repositories!**
- Use environment variables in production
- Use .env.local for development (add to .gitignore)
- Rotate keys immediately if accidentally exposed

## Common Issues:

- **Authentication Required page**: Environment variables not set
- **Database connection errors**: Wrong DATABASE_URL or missing Prisma connection
- **"Toegewezen 0"**: Lottery stats API can't connect to database

After setting these up, trigger a new deployment or use:
```bash
vercel --prod
```