-- A user's attention is global even though capability progress is isolated per plant.
-- Reconcile legacy duplicates deterministically before enforcing the invariant.
WITH ranked_running_sessions AS (
  SELECT
    sessions.id,
    ROW_NUMBER() OVER (
      PARTITION BY sessions.user_id
      ORDER BY sessions.started_at DESC, sessions.id DESC
    ) AS running_rank
  FROM public.habit_sessions AS sessions
  WHERE sessions.status = 'running'
), sessions_to_stop AS (
  SELECT
    sessions.id,
    sessions.duration_seconds,
    LEAST(
      sessions.duration_seconds,
      sessions.accumulated_seconds
        + CASE
            WHEN sessions.last_resumed_at IS NULL THEN 0
            ELSE GREATEST(
              0,
              FLOOR(EXTRACT(EPOCH FROM (now() - sessions.last_resumed_at)))::INTEGER
            )
          END
    ) AS elapsed_seconds
  FROM public.habit_sessions AS sessions
  INNER JOIN ranked_running_sessions AS ranked
    ON ranked.id = sessions.id
  WHERE ranked.running_rank > 1
)
UPDATE public.habit_sessions AS sessions
SET
  status = CASE
    WHEN stopped.elapsed_seconds >= stopped.duration_seconds
      THEN 'awaiting_completion'
    ELSE 'paused'
  END,
  accumulated_seconds = stopped.elapsed_seconds,
  last_resumed_at = NULL,
  paused_at = CASE
    WHEN stopped.elapsed_seconds < stopped.duration_seconds THEN now()
    ELSE NULL
  END,
  finished_at = CASE
    WHEN stopped.elapsed_seconds >= stopped.duration_seconds THEN now()
    ELSE sessions.finished_at
  END,
  updated_at = now()
FROM sessions_to_stop AS stopped
WHERE sessions.id = stopped.id;

CREATE UNIQUE INDEX habit_sessions_one_running_per_user
  ON public.habit_sessions (user_id)
  WHERE status = 'running';

COMMENT ON INDEX public.habit_sessions_one_running_per_user IS
  'Allows at most one actively running capability timer per user across all plants.';
