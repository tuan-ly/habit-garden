-- Supabase projects with auto_expose_new_tables disabled require explicit table grants.
-- RLS policies from the preceding migration remain the ownership boundary.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.habits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.goal_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.habit_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.daily_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.growth_states TO authenticated;
