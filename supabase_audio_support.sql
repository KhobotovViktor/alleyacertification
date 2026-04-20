-- SQL Migration: Add Audio Support to Articles
-- Run this in your Supabase SQL Editor

ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS "audioUrl" TEXT;

-- Update RLS policies to ensure the new column is accessible (usually covered by existing SELECT *, but good to keep in mind)
-- No changes needed to RLS if you already have:
-- CREATE POLICY "Allow read for all" ON public.articles FOR SELECT USING (true);
