-- F2: Destinations table
CREATE TABLE public.destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL,
  region text,
  landscape_type text[] DEFAULT '{}',
  crowd_level int DEFAULT 5 CHECK (crowd_level >= 1 AND crowd_level <= 10),
  pace text DEFAULT 'moderate',
  mood_affinities jsonb DEFAULT '{"burned_out":0.5,"adventurous":0.5,"social":0.5,"reflective":0.5}',
  experience_tags text[] DEFAULT '{}',
  dietary_friendly text[] DEFAULT '{}',
  visa_status_in text DEFAULT 'required',
  budget_level text DEFAULT 'mid',
  freshness_score int DEFAULT 50,
  trend_direction text DEFAULT 'rising',
  cover_image_url text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- Destinations are readable by all authenticated users
CREATE POLICY "Authenticated users can read destinations"
  ON public.destinations FOR SELECT TO authenticated USING (true);

-- F2: Mood sessions table
CREATE TABLE public.mood_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_state text NOT NULL DEFAULT 'adventurous',
  energy_level text NOT NULL DEFAULT 'high',
  planning_horizon text NOT NULL DEFAULT 'exploring',
  trip_mode text NOT NULL DEFAULT 'solo',
  ranked_destinations jsonb,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '6 hours'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.mood_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mood sessions"
  ON public.mood_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own mood sessions"
  ON public.mood_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own mood sessions"
  ON public.mood_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own mood sessions"
  ON public.mood_sessions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Updated_at triggers
CREATE TRIGGER update_destinations_updated_at
  BEFORE UPDATE ON public.destinations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mood_sessions_updated_at
  BEFORE UPDATE ON public.mood_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for mood_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.mood_sessions;