
-- Create itineraries table
CREATE TABLE public.itineraries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  cities text[] NOT NULL DEFAULT '{}',
  days_count integer NOT NULL DEFAULT 1,
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  budget_summary jsonb DEFAULT '{}'::jsonb,
  edit_history jsonb[] DEFAULT '{}',
  is_user_edited boolean NOT NULL DEFAULT false,
  generated_by text DEFAULT 'gemini',
  total_est_cost_inr integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own itineraries"
  ON public.itineraries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own itineraries"
  ON public.itineraries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own itineraries"
  ON public.itineraries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own itineraries"
  ON public.itineraries FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
