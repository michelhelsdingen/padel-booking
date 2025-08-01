# Supabase Database MCP Setup for Claude Code

## Overview
This setup enables Claude Code to connect directly to your Supabase PostgreSQL database for real-time troubleshooting and data analysis.

## Prerequisites
- MCP PostgreSQL server installed globally: `npm install -g mcp-postgres-server`
- Supabase database password (get from Supabase Dashboard → Settings → Database)

## Configuration

### Environment Variables
Add to your shell profile (`.zshrc`, `.bashrc`, etc.):
```bash
export SUPABASE_DB_PASSWORD="your-actual-database-password-here"
```

### Database Connection Details
- Host: `aws-0-eu-west-3.pooler.supabase.com`
- Port: `5432`
- Database: `postgres`
- Username: `postgres.nrlxlcluutploehbbzkq`
- SSL: Required

### MCP Server Configuration
The MCP server is configured in `~/.claude/settings.json` with the following settings:

```json
{
  "mcpServers": {
    "supabase-db": {
      "command": "mcp-postgres-server",
      "args": [
        "--host", "aws-0-eu-west-3.pooler.supabase.com",
        "--port", "5432",
        "--database", "postgres",
        "--username", "postgres.nrlxlcluutploehbbzkq",
        "--password", "${SUPABASE_DB_PASSWORD}",
        "--ssl", "require"
      ],
      "env": {
        "SUPABASE_DB_PASSWORD": "${SUPABASE_DB_PASSWORD}"
      }
    }
  }
}
```

## Getting Your Database Password

1. Go to your Supabase Dashboard
2. Navigate to Settings → Database
3. Look for "Connection string" or "Database settings"
4. Copy the password from the connection string
5. Set it as an environment variable:
   ```bash
   export SUPABASE_DB_PASSWORD="your-password-here"
   ```

## Testing the Connection

Once configured, restart Claude Code and you should be able to use database queries like:

```sql
-- Test connection
SELECT current_database(), current_user, version();

-- Check application tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check team data
SELECT COUNT(*) as total_teams FROM teams;
SELECT COUNT(*) as total_assignments FROM assignments;
```

## Troubleshooting Queries

See `TROUBLESHOOTING_QUERIES.sql` for a collection of useful debugging queries.

## Security Notes

- The MCP server uses SSL/TLS encryption
- Database password is stored in environment variables, not in configuration files
- The connection uses read-write access - be careful with modifications
- Consider using a read-only database user for safer troubleshooting

## Usage

Once connected, Claude Code can:
- Execute SQL queries directly
- Inspect database schema
- Analyze data integrity
- Debug application issues
- Monitor database performance
- Generate reports and insights

Simply ask Claude Code to run database queries and it will use the MCP connection automatically.