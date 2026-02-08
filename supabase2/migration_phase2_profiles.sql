-- Phase 2: Profile Module Enhancements
-- Run AFTER schema.sql and migration_phase2.sql

-- 1. ADD PROFILE MODULE COLUMNS (skills, experience for professionals; branding, team for employers)
alter table public.profiles add column if not exists skills jsonb default '[]'::jsonb; -- ["React", "Node.js"]
alter table public.profiles add column if not exists experience jsonb default '[]'::jsonb; -- [{title, company, start, end, description}]
alter table public.profiles add column if not exists company_branding jsonb default '{}'::jsonb; -- {name, logo_url, website, description}
alter table public.profiles add column if not exists team_members jsonb default '[]'::jsonb; -- [{name, email, role}]
alter table public.profiles add column if not exists onboarding_completed boolean default false;

-- 2. FIX RLS: Restrict profile select to authenticated users (protects resume_url)
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Authenticated users can view profiles." on profiles for select using (auth.uid() is not null);

-- 3. STORAGE BUCKET FOR RESUMES (run in Supabase Dashboard > Storage or via API)
-- insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false);

-- 4. STORAGE RLS POLICIES (run in Supabase Dashboard > Storage > resumes bucket > Policies)
-- Policy: Users can upload their own resume
-- create policy "Users upload own resume" on storage.objects for insert with check (
--   bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Policy: Users can read their own resume
-- create policy "Users read own resume" on storage.objects for select using (
--   bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Policy: Users can update/delete their own resume
-- create policy "Users manage own resume" on storage.objects for update using (
--   bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
-- );
-- create policy "Users delete own resume" on storage.objects for delete using (
--   bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
-- );

-- 5. ALLOW USERS TO INSERT THEIR OWN PROFILE (for edge cases)
drop policy if exists "Users can insert own profile." on profiles;
create policy "Users can insert own profile." on profiles for insert with check (auth.uid() = id);
