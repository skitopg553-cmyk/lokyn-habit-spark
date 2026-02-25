
-- 1. Add auth_id and created_at to user_profile
ALTER TABLE public.user_profile ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;
ALTER TABLE public.user_profile ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 2. Add user_id to completions for direct user filtering
ALTER TABLE public.completions ADD COLUMN IF NOT EXISTS user_id UUID;

-- 3. Create trigger function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profile (id, auth_id, prenom, created_at, streak_actuel, streak_record, niveau, xp_total, objectifs)
  VALUES (NEW.id::text, NEW.id, 'Alex', now(), 0, 0, 1, 0, '{}')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 4. Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Drop old permissive RLS policies
DROP POLICY IF EXISTS "Allow all on user_profile" ON public.user_profile;
DROP POLICY IF EXISTS "Allow all on habits" ON public.habits;
DROP POLICY IF EXISTS "Allow all on completions" ON public.completions;

-- 6. Create secure RLS policies for user_profile
CREATE POLICY "Users can view own profile"
  ON public.user_profile FOR SELECT
  USING (auth_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.user_profile FOR UPDATE
  USING (auth_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.user_profile FOR INSERT
  WITH CHECK (auth_id = auth.uid());

-- 7. Create secure RLS policies for habits
CREATE POLICY "Users can view own habits"
  ON public.habits FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own habits"
  ON public.habits FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own habits"
  ON public.habits FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own habits"
  ON public.habits FOR DELETE
  USING (user_id = auth.uid()::text);

-- 8. Create secure RLS policies for completions
CREATE POLICY "Users can view own completions"
  ON public.completions FOR SELECT
  USING (
    habit_id IN (SELECT id FROM public.habits WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Users can insert own completions"
  ON public.completions FOR INSERT
  WITH CHECK (
    habit_id IN (SELECT id FROM public.habits WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Users can delete own completions"
  ON public.completions FOR DELETE
  USING (
    habit_id IN (SELECT id FROM public.habits WHERE user_id = auth.uid()::text)
  );
