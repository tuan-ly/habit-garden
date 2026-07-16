-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'plant_critical', 'plant_died', 'plant_matured', 'achievement', 'streak', 'reminder'
  title TEXT NOT NULL,
  title_vi TEXT,
  message TEXT NOT NULL,
  message_vi TEXT,
  data JSONB, -- Additional data (plant_id, achievement_id, etc.)
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup of user notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read, created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert notifications (via functions)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_title_vi TEXT,
  p_message TEXT,
  p_message_vi TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, title_vi, message, message_vi, data)
  VALUES (p_user_id, p_type, p_title, p_title_vi, p_message, p_message_vi, p_data)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(p_notification_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE notifications
  SET read = true
  WHERE id = ANY(p_notification_ids)
    AND user_id = auth.uid();
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM notifications WHERE user_id = p_user_id AND read = false;
$$;

-- Enhanced update_daily_moisture to send notifications for critical/dead plants
CREATE OR REPLACE FUNCTION update_daily_moisture()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  weather_moisture_mod INTEGER := 0;
  v_plant RECORD;
BEGIN
  -- Get today's weather modifier if exists
  SELECT COALESCE(moisture_modifier, 0) INTO weather_moisture_mod
  FROM daily_weather
  WHERE date = CURRENT_DATE;

  -- Decrease moisture for plants that haven't been watered today
  UPDATE plants p
  SET 
    current_moisture = GREATEST(0, current_moisture - pt.moisture_decay_rate + weather_moisture_mod),
    updated_at = NOW()
  FROM plant_types pt
  WHERE p.plant_type_id = pt.id
    AND p.status = 'growing'
    AND (p.last_watered_at IS NULL OR p.last_watered_at::date < CURRENT_DATE);
  
  -- Send notifications for critical plants (moisture <= 20)
  FOR v_plant IN 
    SELECT p.id, p.user_id, p.name, p.current_moisture
    FROM plants p
    WHERE p.status = 'growing' AND p.current_moisture <= 20 AND p.current_moisture > 0
  LOOP
    PERFORM create_notification(
      v_plant.user_id,
      'plant_critical',
      v_plant.name || ' needs water urgently!',
      v_plant.name || ' cần được tưới nước gấp!',
      'Your plant is at ' || v_plant.current_moisture || '% moisture and will die soon without water.',
      'Cây của bạn chỉ còn ' || v_plant.current_moisture || '% độ ẩm và sẽ chết sớm nếu không được tưới nước.',
      jsonb_build_object('plant_id', v_plant.id, 'moisture', v_plant.current_moisture)
    );
  END LOOP;
  
  -- Kill plants that have reached 0 moisture and send notifications
  FOR v_plant IN 
    SELECT p.id, p.user_id, p.name
    FROM plants p
    WHERE p.current_moisture <= 0 AND p.status = 'growing'
  LOOP
    -- Update plant status
    UPDATE plants
    SET 
      status = 'dead',
      died_at = NOW(),
      death_reason = 'drought',
      current_streak = 0
    WHERE id = v_plant.id;
    
    -- Send death notification
    PERFORM create_notification(
      v_plant.user_id,
      'plant_died',
      v_plant.name || ' has died',
      v_plant.name || ' đã chết',
      'Your plant died from lack of water. You can revive it within 24 hours using water reserves.',
      'Cây của bạn đã chết vì thiếu nước. Bạn có thể hồi sinh nó trong vòng 24 giờ bằng dự trữ nước.',
      jsonb_build_object('plant_id', v_plant.id)
    );
  END LOOP;
END;
$$;;
