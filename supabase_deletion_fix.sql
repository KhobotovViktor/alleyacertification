-- 1. Fix Foreign Key Constraints for Articles
-- The 'tests' table has a reference to 'articles'. 
-- Although the schema says ON DELETE SET NULL, we want to be sure it doesn't block deletion.
ALTER TABLE public.tests 
DROP CONSTRAINT IF EXISTS tests_requiredArticleId_fkey,
ADD CONSTRAINT tests_requiredArticleId_fkey 
    FOREIGN KEY ("requiredArticleId") 
    REFERENCES public.articles(id) 
    ON DELETE SET NULL;

-- 2. Article Progress already has ON DELETE CASCADE in schema, but let's re-verify
ALTER TABLE public.article_progress
DROP CONSTRAINT IF EXISTS article_progress_articleId_fkey,
ADD CONSTRAINT article_progress_articleId_fkey
    FOREIGN KEY ("articleId")
    REFERENCES public.articles(id)
    ON DELETE CASCADE;

-- 3. Enable Deletion Policies for Articles (RLS)
-- If RLS is enabled, we need to explicitly allow DELETE for authenticated users (or whoever is deleting).
-- This assumes public access or admin role check if that's implemented in Supabase.
DROP POLICY IF EXISTS "Allow delete for articles" ON public.articles;
CREATE POLICY "Allow delete for articles" ON public.articles FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow all for articles" ON public.articles;
CREATE POLICY "Allow all for articles" ON public.articles FOR ALL USING (true);

-- 4. Enable Deletion Policies for Tests
DROP POLICY IF EXISTS "Allow delete for tests" ON public.tests;
CREATE POLICY "Allow delete for tests" ON public.tests FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow all for tests" ON public.tests;
CREATE POLICY "Allow all for tests" ON public.tests FOR ALL USING (true);

-- 5. Fix Article Progress Policies
DROP POLICY IF EXISTS "Allow all for article_progress" ON public.article_progress;
CREATE POLICY "Allow all for article_progress" ON public.article_progress FOR ALL USING (true);
