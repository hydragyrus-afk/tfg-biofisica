-- Ejecuta TODO este archivo en Supabase > SQL Editor > New query.
-- Cada tabla tiene propietario y políticas RLS: cada usuario solo puede acceder a sus propios datos.
-- No uses una clave service_role en el frontend.

create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  phase text not null default 'understanding',
  topic_id text,
  status text not null default 'todo' check (status in ('todo','doing','blocked','done')),
  due_date date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null,
  status text not null default 'not_started' check (status in ('not_started','exploring','understood','mastered')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, topic_id)
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  author text not null default '',
  year integer,
  url text,
  topic_id text,
  status text not null default 'to_read' check (status in ('to_read','reading','read','useful')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  topic_id text,
  status text not null default 'idea' check (status in ('idea','building','running','analysed','validated')),
  question text not null default '',
  assumptions text not null default '',
  variables text not null default '',
  results text not null default '',
  link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists sources_user_id_idx on public.sources(user_id);
create index if not exists simulations_user_id_idx on public.simulations(user_id);
create index if not exists topic_progress_user_id_idx on public.topic_progress(user_id);

alter table public.tasks enable row level security;
alter table public.topic_progress enable row level security;
alter table public.sources enable row level security;
alter table public.simulations enable row level security;

drop policy if exists "Users manage their own tasks" on public.tasks;
create policy "Users manage their own tasks" on public.tasks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage their own topic progress" on public.topic_progress;
create policy "Users manage their own topic progress" on public.topic_progress for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage their own sources" on public.sources;
create policy "Users manage their own sources" on public.sources for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage their own simulations" on public.simulations;
create policy "Users manage their own simulations" on public.simulations for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.tasks, public.topic_progress, public.sources, public.simulations to authenticated;
