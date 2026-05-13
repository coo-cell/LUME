-- Lume — initial schema
-- Tables: profiles, modules, module_progress, skills, skill_events, checkins, tokens, token_transactions
-- All tables have RLS enabled with owner-only access.
-- New users get a profiles row and a tokens row with 3000 free tokens via handle_new_user trigger.

------------------------------------------------------------
-- profiles
------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  -- Onboarding
  onboarding_completed boolean not null default false,
  goal_domain text check (goal_domain in ('management', 'productivity', 'entrepreneurship')),
  goal_description text,
  weekly_time_minutes integer,
  content_format text check (content_format in ('text', 'audio', 'both')),

  -- Profile A — Motivation
  motivation_vector text check (motivation_vector in ('approach', 'away_from')),
  energy_source text check (energy_source in ('achievement', 'recognition', 'connection', 'mastery')),
  autonomy_level integer check (autonomy_level between 1 and 5),
  time_horizon text check (time_horizon in ('days', 'weeks', 'months', 'years')),

  -- Profile B — Cognitive style
  depth_vs_breadth integer check (depth_vs_breadth between 1 and 5),
  ambiguity_tolerance integer check (ambiguity_tolerance between 1 and 5),
  processing_style text check (processing_style in ('analytical', 'intuitive')),
  learning_pace text check (learning_pace in ('fast', 'medium', 'deep')),

  -- Profile C — appears after 4 weeks
  strengths_identified boolean not null default false,
  strengths_data jsonb
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

------------------------------------------------------------
-- modules
------------------------------------------------------------
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  domain text,
  title text,
  content jsonb,
  tokens_used integer,

  status text not null default 'generated' check (status in ('generated', 'in_progress', 'completed')),
  started_at timestamptz,
  completed_at timestamptz
);

create index modules_user_id_created_at_idx
  on public.modules (user_id, created_at desc);

alter table public.modules enable row level security;

create policy "Users can view own modules"
  on public.modules for select
  using (auth.uid() = user_id);

create policy "Users can insert own modules"
  on public.modules for insert
  with check (auth.uid() = user_id);

create policy "Users can update own modules"
  on public.modules for update
  using (auth.uid() = user_id);

------------------------------------------------------------
-- module_progress
------------------------------------------------------------
create table public.module_progress (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  time_on_hook_sec integer,
  time_on_core_sec integer,
  time_on_action_sec integer,
  sections_reread integer not null default 0,
  sources_opened boolean not null default false,
  task_completed boolean,
  reflection_length integer,

  pause_responses jsonb
);

create index module_progress_user_id_idx
  on public.module_progress (user_id);

create index module_progress_module_id_idx
  on public.module_progress (module_id);

alter table public.module_progress enable row level security;

create policy "Users can view own progress"
  on public.module_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.module_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.module_progress for update
  using (auth.uid() = user_id);

------------------------------------------------------------
-- skills
------------------------------------------------------------
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  name text not null,
  context_tag text check (context_tag in ('work', 'personal', 'creative', 'leadership')),
  confirmation_count integer not null default 0,
  level text not null default 'discovered' check (level in ('discovered', 'growing', 'experienced', 'master'))
);

create index skills_user_id_idx on public.skills (user_id);

alter table public.skills enable row level security;

create policy "Users can view own skills"
  on public.skills for select
  using (auth.uid() = user_id);

create policy "Users can insert own skills"
  on public.skills for insert
  with check (auth.uid() = user_id);

create policy "Users can update own skills"
  on public.skills for update
  using (auth.uid() = user_id);

create policy "Users can delete own skills"
  on public.skills for delete
  using (auth.uid() = user_id);

------------------------------------------------------------
-- skill_events
------------------------------------------------------------
create table public.skill_events (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  event_description text not null,
  context_type text,
  evidence text,
  confirmed_by_user boolean not null default false
);

create index skill_events_skill_id_idx on public.skill_events (skill_id);
create index skill_events_user_id_idx on public.skill_events (user_id);

alter table public.skill_events enable row level security;

create policy "Users can view own skill events"
  on public.skill_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own skill events"
  on public.skill_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update own skill events"
  on public.skill_events for update
  using (auth.uid() = user_id);

------------------------------------------------------------
-- checkins
------------------------------------------------------------
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  day_number integer not null check (day_number in (7, 14)),
  applied_knowledge boolean,
  application_details text,
  what_changed text
);

create index checkins_user_id_idx on public.checkins (user_id);

alter table public.checkins enable row level security;

create policy "Users can view own checkins"
  on public.checkins for select
  using (auth.uid() = user_id);

create policy "Users can insert own checkins"
  on public.checkins for insert
  with check (auth.uid() = user_id);

create policy "Users can update own checkins"
  on public.checkins for update
  using (auth.uid() = user_id);

------------------------------------------------------------
-- tokens (one row per user)
------------------------------------------------------------
create table public.tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  balance integer not null default 0,
  plan text not null default 'free' check (plan in ('free', 'core', 'pro')),
  plan_tokens_per_month integer,
  next_renewal_at timestamptz,
  rollover_balance integer not null default 0
);

alter table public.tokens enable row level security;

create policy "Users can view own tokens"
  on public.tokens for select
  using (auth.uid() = user_id);

-- Writes go through SECURITY DEFINER server functions only;
-- no client-side update/insert policy by design.

------------------------------------------------------------
-- token_transactions (append-only)
------------------------------------------------------------
create table public.token_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  amount integer not null,
  action_type text not null check (action_type in (
    'onboarding', 'module_generation', 'skill_detection',
    'retrospective', 'purchase', 'renewal'
  )),
  reference_id uuid,
  balance_after integer not null
);

create index token_transactions_user_id_created_at_idx
  on public.token_transactions (user_id, created_at desc);

alter table public.token_transactions enable row level security;

create policy "Users can view own transactions"
  on public.token_transactions for select
  using (auth.uid() = user_id);

------------------------------------------------------------
-- handle_new_user: create profile + grant 3000 free tokens on signup
------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);

  insert into public.tokens (user_id, balance, plan)
  values (new.id, 3000, 'free');

  insert into public.token_transactions (user_id, amount, action_type, balance_after)
  values (new.id, 3000, 'onboarding', 3000);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
