ALTER TABLE public.trip_assist_queries
  ADD COLUMN IF NOT EXISTS user_query text,
  ADD COLUMN IF NOT EXISTS response_json jsonb,
  ADD COLUMN IF NOT EXISTS selected_reason_category text,
  ADD COLUMN IF NOT EXISTS answer_summary text;