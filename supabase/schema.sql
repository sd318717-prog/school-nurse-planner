-- Run this script in Supabase Dashboard > SQL Editor.
-- All tables are scoped to the authenticated user. Do not put student medical data here.
create extension if not exists pgcrypto;

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  institution_symbol text,
  address text,
  contact_name text,
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  activity_type text not null,
  school_id uuid references public.schools(id) on delete set null,
  activity_date date not null,
  notes text,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text text not null,
  note_type text not null default 'תזכורת',
  due_date date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.school_openings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  school_year text not null,
  checklist jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (school_id, school_year)
);

create index if not exists activities_user_date_idx on public.activities(user_id, activity_date);
create index if not exists notes_user_due_idx on public.notes(user_id, due_date);
create index if not exists schools_user_name_idx on public.schools(user_id, name);

alter table public.schools enable row level security;
alter table public.activities enable row level security;
alter table public.notes enable row level security;
alter table public.school_openings enable row level security;

drop policy if exists "Users manage own schools" on public.schools;
create policy "Users manage own schools" on public.schools for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage own activities" on public.activities;
create policy "Users manage own activities" on public.activities for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage own notes" on public.notes;
create policy "Users manage own notes" on public.notes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage own school openings" on public.school_openings;
create policy "Users manage own school openings" on public.school_openings for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Important: do not expose the Supabase service_role key in the browser or in NEXT_PUBLIC_* variables.
