
-- Table: habits
CREATE TABLE public.habits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text DEFAULT 'local_user' NOT NULL,
  nom text NOT NULL,
  categorie text NOT NULL,
  frequence text NOT NULL DEFAULT 'daily',
  jours text[] DEFAULT '{}',
  fois_par_semaine int DEFAULT 1,
  heure_rappel text DEFAULT NULL,
  preuve_requise boolean DEFAULT false,
  xp_estime int DEFAULT 10,
  date_creation timestamp with time zone DEFAULT now(),
  actif boolean DEFAULT true
);

-- Table: completions
CREATE TABLE public.completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id uuid REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  preuve_url text DEFAULT NULL,
  validated_at timestamp with time zone DEFAULT now()
);

-- Table: user_profile
CREATE TABLE public.user_profile (
  id text PRIMARY KEY DEFAULT 'local_user',
  prenom text DEFAULT 'Alex',
  streak_actuel int DEFAULT 0,
  streak_record int DEFAULT 0,
  niveau int DEFAULT 1,
  xp_total int DEFAULT 0,
  objectifs text[] DEFAULT '{}'
);

-- No auth for now, so disable RLS (user_id = 'local_user' hardcoded)
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

-- Allow all for now (no auth, local_user only)
CREATE POLICY "Allow all on habits" ON public.habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on completions" ON public.completions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on user_profile" ON public.user_profile FOR ALL USING (true) WITH CHECK (true);

-- Insert default profile
INSERT INTO public.user_profile (id, prenom) VALUES ('local_user', 'Alex') ON CONFLICT DO NOTHING;
