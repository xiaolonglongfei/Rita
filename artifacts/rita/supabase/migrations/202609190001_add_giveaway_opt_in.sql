ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS giveaway_opt_in_at TIMESTAMPTZ;

COMMENT ON COLUMN public.users.giveaway_opt_in_at IS
  'Timestamp when the user agreed to the Rovi giveaway official rules and entered the promotion.';