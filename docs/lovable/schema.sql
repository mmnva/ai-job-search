-- v1 schema draft for Lovable / Supabase
-- Apply via Supabase SQL editor or `supabase db push` after connecting a project.
-- RLS: every tenant row scoped by auth.uid(). org_id reserved for later teams.

create extension if not exists "pgcrypto";

-- Profiles (from CLAUDE.md / 01-candidate-profile concepts)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  location text,
  country text,
  languages jsonb not null default '[]'::jsonb,
  headline text,
  employment_status text,
  education jsonb not null default '[]'::jsonb,
  experience jsonb not null default '[]'::jsonb,
  skills_primary text[] not null default '{}',
  skills_secondary text[] not null default '{}',
  domain_expertise text[] not null default '{}',
  dealbreakers text[] not null default '{}',
  target_roles text[] not null default '{}',
  target_sectors text[] not null default '{}',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Jobs (paste | url | portal later)
create type public.ingest_channel as enum ('paste', 'url', 'portal');
create type public.fetch_status as enum ('pending', 'ok', 'failed', 'login_wall');

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ingest_channel public.ingest_channel not null default 'paste',
  portal text, -- e.g. freehire; null for paste/url
  source_url text,
  title text,
  company text,
  location text,
  raw_text text not null default '',
  fetch_status public.fetch_status not null default 'pending',
  fetched_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  fit_score numeric,
  skills_match jsonb not null default '{}'::jsonb,
  experience_match jsonb not null default '{}'::jsonb,
  gaps jsonb not null default '[]'::jsonb,
  recommendation text, -- go | no_go | discuss
  eligibility_notes text,
  language_notes text,
  model text,
  prompt_version text,
  cost_tokens integer not null default 0,
  raw_output jsonb,
  created_at timestamptz not null default now()
);

create type public.application_status as enum (
  'active', 'interview', 'offer', 'hired', 'closed'
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  status public.application_status not null default 'active',
  channel text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create type public.document_type as enum ('resume', 'cover');

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  application_id uuid not null references public.applications (id) on delete cascade,
  doc_type public.document_type not null,
  markdown_body text not null default '',
  pdf_path text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.agent_workflow as enum (
  'fetch', 'evaluate', 'draft', 'review', 'portal_search'
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workflow public.agent_workflow not null,
  job_id uuid references public.jobs (id) on delete set null,
  application_id uuid references public.applications (id) on delete set null,
  status text not null default 'running',
  model text,
  prompt_version text,
  input_refs jsonb not null default '{}'::jsonb,
  output jsonb,
  error text,
  token_usage integer not null default 0,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

-- Quotas for SaaS guards
create table if not exists public.usage_quotas (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free',
  applies_used_month integer not null default 0,
  applies_limit_month integer not null default 5,
  period_yyyymm text not null default to_char(now() at time zone 'utc', 'YYYYMM'),
  stripe_customer_id text,
  stripe_subscription_id text,
  updated_at timestamptz not null default now()
);

-- Feature flags (portal search off by default)
create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  notes text
);

insert into public.feature_flags (key, enabled, notes) values
  ('portal_search', false, 'Phase B: FreeHire first; LinkedIn bulk only after legal review')
on conflict (key) do nothing;

-- RLS
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.evaluations enable row level security;
alter table public.applications enable row level security;
alter table public.documents enable row level security;
alter table public.agent_runs enable row level security;
alter table public.usage_quotas enable row level security;

create policy profiles_own on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy jobs_own on public.jobs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy evaluations_own on public.evaluations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy applications_own on public.applications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy documents_own on public.documents
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy agent_runs_own on public.agent_runs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy usage_quotas_select on public.usage_quotas
  for select using (user_id = auth.uid());
create policy usage_quotas_insert on public.usage_quotas
  for insert with check (user_id = auth.uid());
create policy usage_quotas_update on public.usage_quotas
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create unique index if not exists documents_app_type_uidx
  on public.documents (application_id, doc_type);
-- feature_flags: readable by authenticated users
alter table public.feature_flags enable row level security;
create policy feature_flags_read on public.feature_flags
  for select to authenticated using (true);

-- Storage buckets (create in dashboard if SQL storage API unavailable):
-- resumes, exports — private; signed URLs only.
