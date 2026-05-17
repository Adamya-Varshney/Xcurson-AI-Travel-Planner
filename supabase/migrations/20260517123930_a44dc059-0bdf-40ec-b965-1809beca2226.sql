CREATE TABLE public.trip_assist_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  destination text NOT NULL,
  reason text NOT NULL,
  is_custom_reason boolean NOT NULL DEFAULT false,
  response_md text,
  suggested_reasons jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_assist_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trip assist queries"
  ON public.trip_assist_queries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trip assist queries"
  ON public.trip_assist_queries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trip assist queries"
  ON public.trip_assist_queries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_trip_assist_queries_user_created
  ON public.trip_assist_queries (user_id, created_at DESC);