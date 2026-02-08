-- Add new columns to existing tables
alter table public.profiles add column if not exists resume_url text;
alter table public.profiles add column if not exists ai_tags jsonb default '[]'::jsonb;

alter table public.jobs add column if not exists ai_tags jsonb default '[]'::jsonb;

-- Create Messages Table
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Messages
alter table public.messages enable row level security;

-- Policies for Messages (Drop first to avoid conflicts if re-running)
drop policy if exists "Users view their own messages." on messages;
create policy "Users view their own messages." on messages for select using (
  auth.uid() = sender_id or auth.uid() = recipient_id
);

drop policy if exists "Users can send messages." on messages;
create policy "Users can send messages." on messages for insert with check (
  auth.uid() = sender_id
);
