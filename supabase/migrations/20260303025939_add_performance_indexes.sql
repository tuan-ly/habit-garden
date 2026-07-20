-- Composite index for activity_logs (user_id + date range queries)
-- Covers ordered per-user queries more efficiently than separate user + date indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date
  ON activity_logs (user_id, created_at DESC);

-- Composite index for goal_logs (goal_id + date range queries)
-- Covers ordered per-goal queries more efficiently than separate goal + date indexes
CREATE INDEX IF NOT EXISTS idx_goal_logs_goal_date
  ON goal_logs (goal_id, logged_at DESC);;
