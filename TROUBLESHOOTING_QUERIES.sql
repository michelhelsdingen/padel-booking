-- Supabase Database Troubleshooting Queries
-- Use these queries with Claude Code for debugging and analysis

-- =================
-- CONNECTION TESTING
-- =================

-- Test basic connection
SELECT current_database(), current_user, version();

-- Check current time and timezone
SELECT NOW(), current_timestamp, current_setting('timezone');

-- =================
-- SCHEMA INSPECTION
-- =================

-- List all tables in public schema
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Get table sizes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Check table row counts
SELECT 
    schemaname,
    tablename,
    n_tup_ins as "Inserts",
    n_tup_upd as "Updates", 
    n_tup_del as "Deletes",
    n_live_tup as "Live Rows",
    n_dead_tup as "Dead Rows"
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- =================
-- APPLICATION DATA
-- =================

-- Overview of all main tables
SELECT 'teams' as table_name, COUNT(*) as count FROM teams
UNION ALL
SELECT 'team_members', COUNT(*) FROM team_members
UNION ALL  
SELECT 'team_preferences', COUNT(*) FROM team_preferences
UNION ALL
SELECT 'timeslots', COUNT(*) FROM timeslots
UNION ALL
SELECT 'assignments', COUNT(*) FROM assignments
UNION ALL
SELECT 'registration_periods', COUNT(*) FROM registration_periods
UNION ALL
SELECT 'edit_codes', COUNT(*) FROM edit_codes
UNION ALL
SELECT 'admins', COUNT(*) FROM admins
ORDER BY count DESC;

-- =================
-- TEAM ANALYSIS
-- =================

-- Team details with member counts
SELECT 
    t.id,
    t.firstName,
    t.lastName,
    t.contactEmail,
    t.memberCount,
    COUNT(tm.id) as actual_members,
    t.createdAt
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.teamId
GROUP BY t.id, t.firstName, t.lastName, t.contactEmail, t.memberCount, t.createdAt
ORDER BY t.createdAt DESC;

-- Teams with mismatched member counts
SELECT 
    t.id,
    t.firstName || ' ' || t.lastName as team_name,
    t.memberCount as declared_count,
    COUNT(tm.id) as actual_count,
    (t.memberCount - COUNT(tm.id)) as difference
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.teamId
GROUP BY t.id, t.firstName, t.lastName, t.memberCount
HAVING t.memberCount != COUNT(tm.id)
ORDER BY difference DESC;

-- =================
-- LOTTERY ANALYSIS
-- =================

-- Lottery assignment overview
SELECT 
    t.firstName || ' ' || t.lastName as team_name,
    ts.dayOfWeek,
    CASE ts.dayOfWeek
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday' 
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
        WHEN 7 THEN 'Sunday'
    END as day_name,
    ts.startTime || '-' || ts.endTime as time_slot,
    a.priority,
    a.assignmentmethod,
    a.lotteryRound,
    a.assignedAt
FROM assignments a
JOIN teams t ON a.teamId = t.id
JOIN timeslots ts ON a.timeslotId = ts.id
ORDER BY ts.dayOfWeek, ts.startTime, t.lastName;

-- Assignment statistics by day
SELECT 
    CASE ts.dayOfWeek
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday' 
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
        WHEN 7 THEN 'Sunday'
    END as day_name,
    COUNT(*) as teams_assigned,
    ROUND(AVG(a.priority), 2) as avg_priority,
    STRING_AGG(DISTINCT a.assignmentmethod, ', ') as methods_used
FROM assignments a
JOIN timeslots ts ON a.timeslotId = ts.id
GROUP BY ts.dayOfWeek
ORDER BY ts.dayOfWeek;

-- Teams without assignments (unassigned)
SELECT 
    t.id,
    t.firstName || ' ' || t.lastName as team_name,
    t.contactEmail,
    t.memberCount,
    t.createdAt
FROM teams t
LEFT JOIN assignments a ON t.id = a.teamId
WHERE a.id IS NULL
ORDER BY t.createdAt;

-- =================
-- PREFERENCES ANALYSIS
-- =================

-- Team preferences overview
SELECT 
    t.firstName || ' ' || t.lastName as team_name,
    tp.priority,
    CASE ts.dayOfWeek
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday' 
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
        WHEN 7 THEN 'Sunday'
    END as day_name,
    ts.startTime || '-' || ts.endTime as time_slot,
    tp.createdAt
FROM team_preferences tp
JOIN teams t ON tp.teamId = t.id
JOIN timeslots ts ON tp.timeslotId = ts.id
ORDER BY t.lastName, tp.priority;

-- Most popular timeslots (by preferences)
SELECT 
    CASE ts.dayOfWeek
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
        WHEN 7 THEN 'Sunday'
    END as day_name,
    ts.startTime || '-' || ts.endTime as time_slot,
    COUNT(*) as preference_count,
    ts.maxTeams,
    ROUND((COUNT(*) * 100.0 / ts.maxTeams), 1) as demand_percentage
FROM team_preferences tp
JOIN timeslots ts ON tp.timeslotId = ts.id
WHERE ts.isActive = true
GROUP BY ts.id, ts.dayOfWeek, ts.startTime, ts.endTime, ts.maxTeams
ORDER BY preference_count DESC;

-- =================
-- TIMESLOT ANALYSIS
-- =================

-- Timeslot utilization
SELECT 
    CASE ts.dayOfWeek
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
        WHEN 7 THEN 'Sunday'
    END as day_name,
    ts.startTime || '-' || ts.endTime as time_slot,
    ts.maxTeams,
    COUNT(a.id) as assigned_teams,
    (ts.maxTeams - COUNT(a.id)) as available_spots,
    ROUND((COUNT(a.id) * 100.0 / ts.maxTeams), 1) as utilization_percent,
    ts.isActive
FROM timeslots ts
LEFT JOIN assignments a ON ts.id = a.timeslotId
GROUP BY ts.id, ts.dayOfWeek, ts.startTime, ts.endTime, ts.maxTeams, ts.isActive
ORDER BY ts.dayOfWeek, ts.startTime;

-- Overbooked timeslots (if any)
SELECT 
    ts.id,
    CASE ts.dayOfWeek
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
        WHEN 7 THEN 'Sunday'
    END as day_name,
    ts.startTime || '-' || ts.endTime as time_slot,
    ts.maxTeams,
    COUNT(a.id) as assigned_teams,
    (COUNT(a.id) - ts.maxTeams) as overbooking
FROM timeslots ts
LEFT JOIN assignments a ON ts.id = a.timeslotId
GROUP BY ts.id, ts.dayOfWeek, ts.startTime, ts.endTime, ts.maxTeams
HAVING COUNT(a.id) > ts.maxTeams
ORDER BY overbooking DESC;

-- =================
-- DATA INTEGRITY CHECKS
-- =================

-- Orphaned records check
SELECT 'team_members without team' as issue, COUNT(*) as count
FROM team_members tm
LEFT JOIN teams t ON tm.teamId = t.id
WHERE t.id IS NULL

UNION ALL

SELECT 'team_preferences without team', COUNT(*)
FROM team_preferences tp
LEFT JOIN teams t ON tp.teamId = t.id
WHERE t.id IS NULL

UNION ALL

SELECT 'team_preferences without timeslot', COUNT(*)
FROM team_preferences tp
LEFT JOIN timeslots ts ON tp.timeslotId = ts.id
WHERE ts.id IS NULL

UNION ALL

SELECT 'assignments without team', COUNT(*)
FROM assignments a
LEFT JOIN teams t ON a.teamId = t.id
WHERE t.id IS NULL

UNION ALL

SELECT 'assignments without timeslot', COUNT(*)
FROM assignments a
LEFT JOIN timeslots ts ON a.timeslotId = ts.id
WHERE ts.id IS NULL;

-- Duplicate email check
SELECT 
    contactEmail,
    COUNT(*) as team_count,
    STRING_AGG(firstName || ' ' || lastName, '; ') as team_names
FROM teams
GROUP BY contactEmail
HAVING COUNT(*) > 1
ORDER BY team_count DESC;

-- =================
-- RECENT ACTIVITY
-- =================

-- Recent registrations
SELECT 
    t.firstName || ' ' || t.lastName as team_name,
    t.contactEmail,
    t.memberCount,
    COUNT(tm.id) as actual_members,
    t.createdAt
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.teamId
GROUP BY t.id, t.firstName, t.lastName, t.contactEmail, t.memberCount, t.createdAt
ORDER BY t.createdAt DESC
LIMIT 10;

-- Recent assignments
SELECT 
    t.firstName || ' ' || t.lastName as team_name,
    CASE ts.dayOfWeek
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
        WHEN 7 THEN 'Sunday'
    END as day_name,
    ts.startTime || '-' || ts.endTime as time_slot,
    a.assignmentmethod,
    a.priority,
    a.assignedAt
FROM assignments a
JOIN teams t ON a.teamId = t.id
JOIN timeslots ts ON a.timeslotId = ts.id
ORDER BY a.assignedAt DESC
LIMIT 10;

-- =================
-- EMAIL TRACKING
-- =================

-- Email sending status
SELECT 
    emailsent,
    COUNT(*) as assignment_count,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM assignments)), 1) as percentage
FROM assignments
GROUP BY emailsent
ORDER BY emailsent;

-- Teams with pending emails
SELECT 
    t.firstName || ' ' || t.lastName as team_name,
    t.contactEmail,
    CASE ts.dayOfWeek
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
        WHEN 7 THEN 'Sunday'
    END as day_name,
    ts.startTime || '-' || ts.endTime as time_slot,
    a.assignedAt
FROM assignments a
JOIN teams t ON a.teamId = t.id
JOIN timeslots ts ON a.timeslotId = ts.id
WHERE a.emailsent = false
ORDER BY a.assignedAt;

-- =================
-- PERFORMANCE QUERIES
-- =================

-- Database size information
SELECT
    pg_size_pretty(pg_database_size(current_database())) as database_size;

-- Table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;