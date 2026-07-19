UPDATE profiles p
SET xp = COALESCE((
  SELECT SUM(xp_earned) FROM activity_logs WHERE user_id = p.id
), 0)
WHERE p.xp = 0
AND EXISTS (SELECT 1 FROM activity_logs WHERE user_id = p.id AND xp_earned > 0);;
