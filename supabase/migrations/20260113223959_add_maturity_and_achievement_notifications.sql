-- Update water_plant function to send notification when plant matures
CREATE OR REPLACE FUNCTION water_plant(p_plant_id UUID, p_user_id UUID, p_difficulty TEXT DEFAULT NULL, p_notes TEXT DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plant RECORD;
  v_plant_type RECORD;
  v_xp_earned INTEGER := 10;
  v_is_morning BOOLEAN;
  v_streak_bonus INTEGER := 0;
  v_new_streak INTEGER;
  v_new_moisture INTEGER;
  v_new_growth DECIMAL;
  v_just_matured BOOLEAN := false;
BEGIN
  SELECT * INTO v_plant FROM plants WHERE id = p_plant_id AND user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plant not found');
  END IF;
  
  SELECT * INTO v_plant_type FROM plant_types WHERE id = v_plant.plant_type_id;
  
  IF v_plant.last_watered_at IS NOT NULL AND v_plant.last_watered_at::date = CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already watered today');
  END IF;
  
  -- Check if plant is dead
  IF v_plant.status = 'dead' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot water dead plant');
  END IF;
  
  v_is_morning := EXTRACT(HOUR FROM NOW()) < 9;
  IF v_is_morning THEN
    v_xp_earned := v_xp_earned + 5;
  END IF;
  
  IF v_plant.last_watered_at IS NOT NULL AND v_plant.last_watered_at::date = CURRENT_DATE - INTERVAL '1 day' THEN
    v_new_streak := v_plant.current_streak + 1;
    v_streak_bonus := LEAST(v_new_streak, 10);
    v_xp_earned := v_xp_earned + v_streak_bonus;
  ELSE
    v_new_streak := 1;
  END IF;
  
  v_new_moisture := LEAST(100, v_plant.current_moisture + v_plant_type.moisture_boost);
  
  v_new_growth := ((v_plant.total_waterings + 1)::DECIMAL / v_plant_type.maturity_days) * 100;
  v_new_growth := LEAST(v_new_growth, 100);
  
  -- Check if plant just matured
  v_just_matured := v_new_growth >= 100 AND v_plant.growth_percentage < 100;
  
  UPDATE plants SET
    current_moisture = v_new_moisture,
    growth_percentage = v_new_growth,
    total_waterings = total_waterings + 1,
    current_streak = v_new_streak,
    longest_streak = GREATEST(longest_streak, v_new_streak),
    last_watered_at = NOW(),
    status = CASE WHEN v_new_growth >= 100 THEN 'mature' ELSE status END,
    matured_at = CASE WHEN v_new_growth >= 100 AND matured_at IS NULL THEN NOW() ELSE matured_at END,
    updated_at = NOW()
  WHERE id = p_plant_id;
  
  INSERT INTO watering_logs (plant_id, user_id, difficulty, notes, xp_earned, morning_bonus, streak_bonus)
  VALUES (p_plant_id, p_user_id, p_difficulty, p_notes, v_xp_earned, v_is_morning, v_streak_bonus);
  
  UPDATE profiles SET
    xp = xp + v_xp_earned,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Send maturity notification if just matured
  IF v_just_matured THEN
    PERFORM create_notification(
      p_user_id,
      'plant_matured',
      v_plant.name || ' has fully grown!',
      v_plant.name || ' đã trưởng thành!',
      'Congratulations! Your plant has reached full maturity. Your habit is now well established!',
      'Chúc mừng! Cây của bạn đã trưởng thành hoàn toàn. Thói quen của bạn giờ đã được thiết lập vững chắc!',
      jsonb_build_object('plant_id', p_plant_id, 'plant_name', v_plant.name)
    );
  END IF;
  
  -- Send streak milestone notifications
  IF v_new_streak IN (7, 14, 30, 60, 100) THEN
    PERFORM create_notification(
      p_user_id,
      'streak',
      v_new_streak || ' day streak!',
      'Chuỗi ' || v_new_streak || ' ngày!',
      'Amazing! You''ve maintained a ' || v_new_streak || ' day streak with ' || v_plant.name || '!',
      'Tuyệt vời! Bạn đã duy trì chuỗi ' || v_new_streak || ' ngày với ' || v_plant.name || '!',
      jsonb_build_object('plant_id', p_plant_id, 'streak', v_new_streak)
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'xp_earned', v_xp_earned,
    'new_streak', v_new_streak,
    'new_moisture', v_new_moisture,
    'new_growth', v_new_growth,
    'morning_bonus', v_is_morning,
    'just_matured', v_just_matured
  );
END;
$$;

-- Function to send notification when achievement is unlocked
CREATE OR REPLACE FUNCTION notify_achievement_unlocked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achievement RECORD;
BEGIN
  SELECT * INTO v_achievement FROM achievements WHERE id = NEW.achievement_id;
  
  IF FOUND THEN
    PERFORM create_notification(
      NEW.user_id,
      'achievement',
      'Achievement Unlocked: ' || v_achievement.name,
      'Thành tựu mới: ' || v_achievement.name_vi,
      v_achievement.description || ' (+' || v_achievement.xp_reward || ' XP)',
      v_achievement.description_vi || ' (+' || v_achievement.xp_reward || ' XP)',
      jsonb_build_object(
        'achievement_id', NEW.achievement_id,
        'icon', v_achievement.icon,
        'xp_reward', v_achievement.xp_reward
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for achievement notifications
DROP TRIGGER IF EXISTS on_achievement_unlocked ON user_achievements;
CREATE TRIGGER on_achievement_unlocked
  AFTER INSERT ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION notify_achievement_unlocked();;
