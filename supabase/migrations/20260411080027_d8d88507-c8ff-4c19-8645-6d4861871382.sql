
CREATE TABLE public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  destination_name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  description TEXT,
  experience_tags TEXT[] DEFAULT '{}',
  budget_level TEXT,
  fit_score INTEGER,
  match_reason TEXT,
  source TEXT DEFAULT 'mood_match',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wishlist"
ON public.wishlist FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own wishlist"
ON public.wishlist FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own wishlist"
ON public.wishlist FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
