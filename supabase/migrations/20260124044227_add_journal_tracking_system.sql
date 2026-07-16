-- Add journal tracking columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS journal_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_journal_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_journal_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS total_journal_entries INTEGER DEFAULT 0;

COMMENT ON COLUMN profiles.journal_streak IS 'Current consecutive days of writing notes when watering';
COMMENT ON COLUMN profiles.longest_journal_streak IS 'Longest journal streak ever achieved';
COMMENT ON COLUMN profiles.last_journal_date IS 'Last date user wrote a note';
COMMENT ON COLUMN profiles.total_journal_entries IS 'Total number of notes written';

-- Add note_bonus column to watering_logs to track XP bonus from notes
ALTER TABLE watering_logs 
ADD COLUMN IF NOT EXISTS note_bonus INTEGER DEFAULT 0;

COMMENT ON COLUMN watering_logs.note_bonus IS 'XP bonus earned from writing notes';

-- Insert journal-related achievements
INSERT INTO achievements (id, name, name_vi, description, description_vi, icon, requirement_type, requirement_value, xp_reward, is_hidden)
VALUES 
  ('first_journal', 'First Reflection', 'Suy Nghĩ Đầu Tiên', 'Write your first note', 'Viết ghi chú đầu tiên', '📝', 'journal_count', 1, 10, false),
  ('journal_10', 'Thoughtful Gardener', 'Người Làm Vườn Sâu Sắc', 'Write 10 notes', 'Viết 10 ghi chú', '📔', 'journal_count', 10, 25, false),
  ('journal_50', 'Reflective Soul', 'Tâm Hồn Chiêm Nghiệm', 'Write 50 notes', 'Viết 50 ghi chú', '📚', 'journal_count', 50, 75, false),
  ('journal_100', 'Master Chronicler', 'Sử Gia Bậc Thầy', 'Write 100 notes', 'Viết 100 ghi chú', '🏆', 'journal_count', 100, 150, false),
  ('journal_streak_3', 'Journal Beginner', 'Người Viết Mới', '3-day journal streak', 'Chuỗi viết nhật ký 3 ngày', '✏️', 'journal_streak', 3, 15, false),
  ('journal_streak_7', 'Weekly Reflector', 'Người Suy Ngẫm Tuần', '7-day journal streak', 'Chuỗi viết nhật ký 7 ngày', '📓', 'journal_streak', 7, 35, false),
  ('journal_streak_14', 'Dedicated Writer', 'Người Viết Tận Tâm', '14-day journal streak', 'Chuỗi viết nhật ký 14 ngày', '📖', 'journal_streak', 14, 60, false),
  ('journal_streak_30', 'Journal Master', 'Bậc Thầy Nhật Ký', '30-day journal streak', 'Chuỗi viết nhật ký 30 ngày', '🌟', 'journal_streak', 30, 100, false)
ON CONFLICT (id) DO NOTHING;;
