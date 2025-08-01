-- Debug assignments table
SELECT COUNT(*) as total_assignments FROM assignments;

-- Show all assignments with details
SELECT 
  id,
  teamId,
  timeslotId,
  assignmentmethod,
  lotteryRound,
  priority,
  emailsent,
  assignedAt
FROM assignments
ORDER BY assignedAt DESC;