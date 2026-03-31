-- SQL Migration: Setup Supabase Storage for Podcasts
-- Run this in your Supabase SQL Editor

-- 1. Create a public bucket named 'podcasts'
-- Note: You can also do this manually in the Supabase Dashboard -> Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('podcasts', 'podcasts', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS Policies for the 'podcasts' bucket

-- Allow public access to read files
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'podcasts');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'podcasts' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their own files (optional, but good for cleanup)
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE 
USING (bucket_id = 'podcasts' AND auth.role() = 'authenticated');
