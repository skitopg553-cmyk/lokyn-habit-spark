-- ============================================================
-- LOKYN Phase 2 — Auth Migration
-- Timestamp: 20260224094310
-- ============================================================

-- 1. Add user_id_new (UUID from auth) to habits
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS user_id_new UUID REFERENCES auth.users(id);

-- 2. Add user_id (UUID from auth) to completions
ALTER TABLE public.completions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. Add auth_id to user_profile (links to auth.users)
ALTER TABLE public.user_profile
  ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

-- 4. Trigger: auto-create user_profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profile (id, auth_id, prenom, streak_actuel, streak_record, niveau, xp_total, objectifs)
  VALUES (
    gen_random_uuid()::text,
    new.id,
    'Alex',
    0,
    0,
    1,
    0,
    '{}'
  )
  ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. RLS policies with local_user fallback (transition-safe)

-- habits
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on habits" ON public.habits;
DROP POLICY IF EXISTS "Users manage own habits" ON public.habits;
CREATE POLICY "Users manage own habits" ON public.habits
  FOR ALL
  USING (
    auth.uid()::text = user_id
    OR user_id = 'local_user'
  );

-- completions
ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on completions" ON public.completions;
DROP POLICY IF EXISTS "Users manage own completions" ON public.completions;
CREATE POLICY "Users manage own completions" ON public.completions
  FOR ALL
  USING (
    habit_id IN (
      SELECT id FROM public.habits
      WHERE auth.uid()::text = user_id OR user_id = 'local_user'
    )
  );

-- user_profile
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on user_profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users manage own profile" ON public.user_profile;
CREATE POLICY "Users manage own profile" ON public.user_profile
  FOR ALL
  USING (
    auth_id = auth.uid()
    OR id = 'local_user'
  );
