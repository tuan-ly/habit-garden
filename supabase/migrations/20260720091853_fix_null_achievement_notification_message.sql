-- Legacy achievement rows may not have localized descriptions. Concatenating
-- NULL with the XP suffix produced a NULL notification message and aborted the
-- user_achievements insert that runs after watering.
CREATE OR REPLACE FUNCTION public.notify_achievement_unlocked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_achievement RECORD;
  v_name TEXT;
  v_name_vi TEXT;
  v_message TEXT;
  v_message_vi TEXT;
BEGIN
  SELECT *
  INTO v_achievement
  FROM public.achievements
  WHERE id = NEW.achievement_id;

  IF FOUND THEN
    v_name := COALESCE(NULLIF(BTRIM(v_achievement.name), ''), NEW.achievement_id);
    v_name_vi := COALESCE(NULLIF(BTRIM(v_achievement.name_vi), ''), v_name);
    v_message := COALESCE(
      NULLIF(BTRIM(v_achievement.description), ''),
      'You unlocked ' || v_name || '!'
    ) || ' (+' || COALESCE(v_achievement.xp_reward, 0) || ' XP)';
    v_message_vi := COALESCE(
      NULLIF(BTRIM(v_achievement.description_vi), ''),
      'Bạn đã mở khóa ' || v_name_vi || '!'
    ) || ' (+' || COALESCE(v_achievement.xp_reward, 0) || ' XP)';

    PERFORM public.create_notification(
      NEW.user_id,
      'achievement',
      'Achievement Unlocked: ' || v_name,
      'Thành tựu mới: ' || v_name_vi,
      v_message,
      v_message_vi,
      jsonb_build_object(
        'achievement_id', NEW.achievement_id,
        'icon', v_achievement.icon,
        'xp_reward', COALESCE(v_achievement.xp_reward, 0)
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- This function is only an internal trigger target; it must not be callable
-- through the Data API by anonymous or signed-in clients.
REVOKE ALL ON FUNCTION public.notify_achievement_unlocked() FROM PUBLIC, anon, authenticated;
