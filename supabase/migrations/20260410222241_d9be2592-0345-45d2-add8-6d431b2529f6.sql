
-- Create vibe_searches table
CREATE TABLE public.vibe_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url_temp TEXT,
  extracted_vibe JSONB,
  match_explanation TEXT,
  matched_destinations JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vibe_searches ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can read own vibe searches"
  ON public.vibe_searches FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own vibe searches"
  ON public.vibe_searches FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own vibe searches"
  ON public.vibe_searches FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Create vibe-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vibe-images', 'vibe-images', true);

-- Storage RLS: authenticated users can upload to their own folder
CREATE POLICY "Users can upload vibe images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vibe-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Anyone can read (public bucket)
CREATE POLICY "Public read vibe images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'vibe-images');

-- Users can delete their own vibe images
CREATE POLICY "Users can delete own vibe images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vibe-images' AND (storage.foldername(name))[1] = auth.uid()::text);
