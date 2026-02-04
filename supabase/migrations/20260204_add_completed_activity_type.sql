-- Add 'completed' activity type to activity_logs constraint
-- 'completed' = "I did it" for plants without numeric goals

-- Drop existing constraint
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_type_check;

-- Add updated constraint with 'completed' type
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_type_check
CHECK (activity_type IN ('watering', 'completed', 'progress', 'rest_day', 'reflection'));
