-- SQL Migration: Setup Supabase Storage for Podcasts
-- Run this in your Supabase SQL Editor

-- 1. Create a public bucket named 'podcasts'
-- Note: You can also do this manually in the Supabase Dashboard -> Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('podcasts', 'podcasts', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS Policies for the 'podcasts' bucket

-- Allow anyone to read files (required for the player to work)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'podcasts');

-- Allow uploads (since the app uses custom auth, we allow 'anon' role to upload to this specific bucket)
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'podcasts');

-- Allow deletion
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'podcasts');
