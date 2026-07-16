-- Create achievements table
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_vi TEXT NOT NULL,
  description TEXT,
  description_vi TEXT,
  icon TEXT NOT NULL,
  
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER,
  requirement_data JSONB,
  
  xp_reward INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default achievements
INSERT INTO achievements (id, name, name_vi, icon, requirement_type, requirement_value, xp_reward) VALUES
('first_plant', 'First Seed', 'Hạt giống đầu tiên', '🌱', 'plants_created', 1, 10),
('first_mature', 'First Harvest', 'Thu hoạch đầu tiên', '🌳', 'plants_matured', 1, 100),
('five_mature', 'Gardener', 'Người làm vườn', '👨‍🌾', 'plants_matured', 5, 200),
('streak_7', 'Week Warrior', 'Chiến binh 7 ngày', '🔥', 'streak', 7, 50),
('streak_30', 'Month Master', 'Bậc thầy 30 ngày', '💪', 'streak', 30, 200),
('streak_100', 'Century Legend', 'Huyền thoại 100', '👑', 'streak', 100, 500),
('morning_bird', 'Early Bird', 'Chim sớm', '🌅', 'morning_waterings', 10, 50),
('recovery', 'Phoenix', 'Phượng hoàng', '🔄', 'recovered_plants', 1, 100),
('bamboo_master', 'Bamboo Master', 'Bậc thầy tre', '🎋', 'bamboo_matured', 1, 300);

-- Create user_achievements table
CREATE TABLE user_achievements (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);;
