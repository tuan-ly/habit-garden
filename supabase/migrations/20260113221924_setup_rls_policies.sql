-- Enable RLS on all user tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE watering_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Plants policies
CREATE POLICY "Users can view own plants"
  ON plants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own plants"
  ON plants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plants"
  ON plants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plants"
  ON plants FOR DELETE
  USING (auth.uid() = user_id);

-- Watering logs policies
CREATE POLICY "Users can view own watering logs"
  ON watering_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own watering logs"
  ON watering_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  USING (EXISTS (SELECT 1 FROM plants WHERE plants.id = goals.plant_id AND plants.user_id = auth.uid()));

CREATE POLICY "Users can create own goals"
  ON goals FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM plants WHERE plants.id = goals.plant_id AND plants.user_id = auth.uid()));

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  USING (EXISTS (SELECT 1 FROM plants WHERE plants.id = goals.plant_id AND plants.user_id = auth.uid()));

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  USING (EXISTS (SELECT 1 FROM plants WHERE plants.id = goals.plant_id AND plants.user_id = auth.uid()));

-- Goal logs policies
CREATE POLICY "Users can view own goal logs"
  ON goal_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goal logs"
  ON goal_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Goal adjustments policies
CREATE POLICY "Users can view own goal adjustments"
  ON goal_adjustments FOR SELECT
  USING (EXISTS (SELECT 1 FROM goals JOIN plants ON plants.id = goals.plant_id WHERE goals.id = goal_adjustments.goal_id AND plants.user_id = auth.uid()));

CREATE POLICY "Users can update own goal adjustments"
  ON goal_adjustments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM goals JOIN plants ON plants.id = goals.plant_id WHERE goals.id = goal_adjustments.goal_id AND plants.user_id = auth.uid()));

-- User achievements policies
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);;
