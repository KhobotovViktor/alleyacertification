-- SQL Migration: Add Advanced Test Settings
-- Run this in your Supabase SQL Editor

-- 1. Add noRepeatQuestions to tests table
ALTER TABLE public.tests 
ADD COLUMN IF NOT EXISTS "noRepeatQuestions" BOOLEAN DEFAULT FALSE;

-- 2. Add answeredQuestionIds to results table to track which questions were seen/answered
ALTER TABLE public.results 
ADD COLUMN IF NOT EXISTS "answeredQuestionIds" JSONB DEFAULT '[]'::jsonb;

-- Note: Using JSONB for maximum flexibility and compatibility with Supabase JS client
