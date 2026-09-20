-- Run at drawing time to list eligible entrants and their current entry totals.
-- Keep the SQL cap in sync with GIVEAWAY_BONUS_ENTRY_CAP in lib/giveaway.ts.
SELECT
  u.id AS user_id,
  u.email,
  u.giveaway_opt_in_at,
  LEAST(
    COUNT(r.id) FILTER (
      WHERE r.is_verified = TRUE
        AND r.moderation_status = 'approved'
        AND r.created_at >= u.giveaway_opt_in_at
        AND r.created_at <= NOW()
    ),
    3
  )::INTEGER AS bonus_entries,
  (
    1 + LEAST(
      COUNT(r.id) FILTER (
        WHERE r.is_verified = TRUE
          AND r.moderation_status = 'approved'
          AND r.created_at >= u.giveaway_opt_in_at
          AND r.created_at <= NOW()
      ),
      3
    )
  )::INTEGER AS total_entries
FROM public.users AS u
LEFT JOIN public.reviews AS r
  ON r.student_id = u.id
WHERE u.giveaway_opt_in_at IS NOT NULL
GROUP BY u.id, u.email, u.giveaway_opt_in_at
ORDER BY total_entries DESC, u.giveaway_opt_in_at ASC;