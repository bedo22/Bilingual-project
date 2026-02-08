-- ============================================================================
-- Phase 3 Migration: Job Board Module
-- ============================================================================
-- This migration adds:
-- 1. AI summary field to jobs table
-- 2. saved_jobs table for professionals to bookmark jobs
-- 3. Tightened RLS policies with WITH CHECK clauses
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Add AI summary column to jobs table
-- ----------------------------------------------------------------------------
-- Bilingual JSONB format: { "en": "...", "ar": "..." }
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS ai_summary jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.jobs.ai_summary IS 'AI-generated job summary in bilingual format {en, ar}';

-- ----------------------------------------------------------------------------
-- 2. Create saved_jobs table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  
  -- Prevent duplicate saves
  UNIQUE (job_id, user_id)
);

-- Enable RLS
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. RLS Policies for saved_jobs
-- ----------------------------------------------------------------------------

-- Users can view their own saved jobs
CREATE POLICY "Users can view their saved jobs"
ON public.saved_jobs FOR SELECT
USING (auth.uid() = user_id);

-- Only professionals can save jobs
CREATE POLICY "Professionals can save jobs"
ON public.saved_jobs FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'professional'
  )
);

-- Users can unsave (delete) their own saved jobs
CREATE POLICY "Users can unsave jobs"
ON public.saved_jobs FOR DELETE
USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. Indexes for saved_jobs
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS saved_jobs_user_id_idx ON public.saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS saved_jobs_job_id_idx ON public.saved_jobs(job_id);

-- ----------------------------------------------------------------------------
-- 5. Tighten existing UPDATE RLS policies
-- ----------------------------------------------------------------------------

-- 5a. Jobs: ensure employer_id cannot be changed
DROP POLICY IF EXISTS "Employers can update their own jobs." ON public.jobs;

CREATE POLICY "Employers can update their own jobs."
ON public.jobs FOR UPDATE
USING (auth.uid() = employer_id)
WITH CHECK (auth.uid() = employer_id);

-- 5b. Applications: restrict employer updates to prevent field tampering
DROP POLICY IF EXISTS "Employers can update status." ON public.applications;

CREATE POLICY "Employers can update application status"
ON public.applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j 
    WHERE j.id = applications.job_id 
    AND j.employer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jobs j 
    WHERE j.id = applications.job_id 
    AND j.employer_id = auth.uid()
  )
);

-- 5c. (Optional) Allow applicants to update their own application (e.g., cover letter)
CREATE POLICY "Applicants can update their own application"
ON public.applications FOR UPDATE
USING (auth.uid() = applicant_id)
WITH CHECK (auth.uid() = applicant_id);

-- ----------------------------------------------------------------------------
-- 6. Additional indexes for job board performance
-- ----------------------------------------------------------------------------
-- Index for filtering published/open jobs by date
CREATE INDEX IF NOT EXISTS jobs_status_created_idx ON public.jobs(status, created_at DESC);

-- Index for employer's job listing
CREATE INDEX IF NOT EXISTS jobs_employer_created_idx ON public.jobs(employer_id, created_at DESC);

-- GIN index for AI tags search (if filtering by tags)
CREATE INDEX IF NOT EXISTS jobs_ai_tags_idx ON public.jobs USING GIN (ai_tags);

-- GIN index for skills tags search
CREATE INDEX IF NOT EXISTS jobs_skills_tags_idx ON public.jobs USING GIN (skills_tags);
