-- Sprint 2: skill detection flow
-- Adds clarifying_answers to skill_events so the full event→questions→skills
-- dialog is persisted alongside each confirmation.

alter table public.skill_events
  add column if not exists clarifying_answers jsonb not null default '[]'::jsonb;
