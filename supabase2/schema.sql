-- 1. ENUMS
create type public.user_role as enum ('employer', 'professional');
create type public.job_status as enum ('open', 'closed', 'draft');
create type public.application_status as enum ('pending', 'accepted', 'rejected');

-- 2. PROFILES (Users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name jsonb not null default '{}'::jsonb, -- { "en": "John", "ar": "جون" }
  role user_role,
  bio jsonb default '{}'::jsonb, 
  avatar_url text,
  resume_url text, -- Private file path (Phase 2 compressed)
  ai_tags jsonb default '[]'::jsonb, -- AI-generated tags (Phase 2 compressed)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. JOBS
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  employer_id uuid references public.profiles(id) on delete cascade not null,
  title jsonb not null default '{}'::jsonb,      -- { "en": "Dev", "ar": "مطور" }
  description jsonb not null default '{}'::jsonb,
  category text,
  budget numeric,
  skills_tags jsonb default '[]'::jsonb,
  ai_tags jsonb default '[]'::jsonb, -- AI-generated tags (Phase 2 compressed)
  status job_status default 'open',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. APPLICATIONS
create table public.applications (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references public.jobs(id) on delete cascade not null,
  applicant_id uuid references public.profiles(id) on delete cascade not null,
  cover_letter text,
  status application_status default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(job_id, applicant_id) -- Prevent duplicate applications
);

-- 5. MESSAGES (Phase 2 Compressed)
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid not null, -- Logic handled in app (e.g. sorted(uid1, uid2)) or separate table (kept simple here)
  sender_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  body text not null, -- Text only
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. ENABLE RLS
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.messages enable row level security;

-- 7. RLS POLICIES

-- Profiles
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Jobs
create policy "Jobs are viewable by everyone." on jobs for select using (true);
create policy "Employers can insert jobs." on jobs for insert with check (
  auth.uid() = employer_id and 
  exists (select 1 from public.profiles where id = auth.uid() and role = 'employer')
);
create policy "Employers can update their own jobs." on jobs for update using (auth.uid() = employer_id);
create policy "Employers can delete their own jobs." on jobs for delete using (auth.uid() = employer_id);

-- Applications
create policy "Applicants view own; Employers view for their jobs" on applications for select using (
  auth.uid() = applicant_id or 
  exists (select 1 from public.jobs where jobs.id = applications.job_id and jobs.employer_id = auth.uid())
);

create policy "Professionals can apply." on applications for insert with check (
  auth.uid() = applicant_id and
  exists (select 1 from public.profiles where id = auth.uid() and role = 'professional')
);

create policy "Employers can update status." on applications for update using (
  exists (select 1 from public.jobs where jobs.id = applications.job_id and jobs.employer_id = auth.uid())
);

-- Messages (Phase 2 Compressed)
create policy "Users view their own messages." on messages for select using (
  auth.uid() = sender_id or auth.uid() = recipient_id
);

create policy "Users can send messages." on messages for insert with check (
  auth.uid() = sender_id
);

-- 8. TRIGGER: Handle New User Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    jsonb_build_object('en', new.raw_user_meta_data->>'full_name_en', 'ar', new.raw_user_meta_data->>'full_name_ar'),
    (new.raw_user_meta_data->>'role')::user_role
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to allow re-running script cleanly
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
