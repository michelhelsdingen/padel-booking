SELECT COUNT(*) as total_assignments FROM assignments;

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