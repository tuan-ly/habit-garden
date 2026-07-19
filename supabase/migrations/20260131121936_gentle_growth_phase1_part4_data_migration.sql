-- Part 4: Data Migration

-- Update plants with gentle growth fields
UPDATE plants SET
  maturity_level = CASE
    WHEN growth_percentage >= 100 THEN 5
    WHEN growth_percentage >= 75 THEN 4
    WHEN growth_percentage >= 50 THEN 3
    WHEN growth_percentage >= 25 THEN 2
    ELSE 1
  END,
  visual_stage = CASE
    WHEN growth_percentage >= 100 THEN 'mature'
    WHEN growth_percentage >= 75 THEN 'growing'
    WHEN growth_percentage >= 50 THEN 'sprout'
    ELSE 'seed'
  END,
  why_i_started = COALESCE(why_i_started, habit_description)
WHERE why_i_started IS NULL OR maturity_level = 1;

-- Set season_name for existing goals
UPDATE goals SET
  season_name = COALESCE(season_name, 'Season ' || season_number::text),
  season_status = CASE
    WHEN current_value >= target_value THEN 'completed'
    ELSE 'active'
  END
WHERE season_name IS NULL;

-- Migrate watering_logs to activity_logs (using correct columns)
INSERT INTO activity_logs (
  plant_id, user_id, activity_type, logged_at, logged_date,
  notes, xp_earned, morning_bonus, streak_bonus, difficulty
)
SELECT
  plant_id, user_id, 'watering', watered_at, watered_date,
  notes, xp_earned, morning_bonus, streak_bonus, difficulty
FROM watering_logs
WHERE NOT EXISTS (
  SELECT 1 FROM activity_logs al
  WHERE al.plant_id = watering_logs.plant_id
  AND al.logged_date = watering_logs.watered_date
  AND al.activity_type = 'watering'
);

-- Migrate goal_logs to activity_logs (using correct columns)
INSERT INTO activity_logs (
  plant_id, season_id, user_id, activity_type, logged_at, logged_date,
  value, notes, is_personal_record
)
SELECT
  gl.plant_id, gl.goal_id, gl.user_id, 'progress', gl.logged_at, gl.logged_date,
  gl.value, gl.notes, gl.is_personal_record
FROM goal_logs gl
WHERE NOT EXISTS (
  SELECT 1 FROM activity_logs al
  WHERE al.plant_id = gl.plant_id
  AND al.logged_date = gl.logged_date
  AND al.activity_type = 'progress'
  AND al.value = gl.value
);;
