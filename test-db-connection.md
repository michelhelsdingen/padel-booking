# Database Connection Test

## Setup Required

1. **Get your Supabase database password:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project: `nrlxlcluutploehbbzkq`
   - Go to Settings → Database
   - Copy the password from your connection string

2. **Set environment variable:**
   ```bash
   export SUPABASE_DB_PASSWORD="your-actual-password-here"
   ```

3. **Restart Claude Code** to load the new MCP server configuration

## Test Queries

Once configured, you should be able to run these queries directly in Claude Code:

### Basic Connection Test
```sql
SELECT current_database(), current_user, version();
```

### Application Tables
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Data Overview
```sql
SELECT 'teams' as table_name, COUNT(*) as count FROM teams
UNION ALL
SELECT 'assignments', COUNT(*) FROM assignments
UNION ALL
SELECT 'team_preferences', COUNT(*) FROM team_preferences;
```

## Expected Results

If everything is working correctly, you should see:
- Current database: `postgres`
- Current user: `postgres`
- Tables: `teams`, `assignments`, `team_preferences`, `timeslots`, etc.
- Data counts matching your application

## Next Steps

Once connected, Claude Code will be able to:
- ✅ Execute any SQL query for troubleshooting
- ✅ Inspect database schema and relationships
- ✅ Analyze data integrity and consistency
- ✅ Debug lottery assignments and preferences
- ✅ Monitor performance and usage patterns
- ✅ Generate insights and reports

Simply ask Claude Code questions like:
- "Show me all team assignments"
- "Which timeslots are most popular?"
- "Are there any data integrity issues?"
- "How is the lottery performing?"