-- ============================================================================
-- Hebrew Voice Tasks — Supabase schema
-- ============================================================================
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- It creates the three core tables plus storage buckets for audio + images.
-- ============================================================================

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enums ---------------------------------------------------------------------
-- Smart task categories. Keep in sync with src/constants/categories.ts.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_category') then
    create type task_category as enum (
      'home',
      'finance',
      'kids',
      'ilay',
      'ella',
      'isabelle',
      'work',
      'airbnb',
      'shopping',
      'legal',
      'inbox'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type task_status as enum (
      'open',
      'needs_scheduling',
      'done'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'source_type') then
    create type source_type as enum (
      'voice',
      'image',
      'manual'
    );
  end if;
end$$;

-- voice_notes ---------------------------------------------------------------
create table if not exists voice_notes (
  id          uuid primary key default gen_random_uuid(),
  audio_url   text,                       -- storage path / public URL of original audio
  transcript  text,                       -- Hebrew transcription
  created_at  timestamptz not null default now()
);

-- images --------------------------------------------------------------------
create table if not exists images (
  id             uuid primary key default gen_random_uuid(),
  image_url      text,                    -- storage path / public URL of original image
  extracted_text text,                    -- OCR result
  created_at     timestamptz not null default now()
);

-- tasks ---------------------------------------------------------------------
create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  category    task_category not null default 'inbox',
  source_type source_type not null default 'manual',
  source_id   uuid,                        -- references voice_notes.id OR images.id
  due_at      timestamptz,                 -- when the task is actually due
  reminder_at timestamptz,                 -- when to fire a local notification
  status      task_status not null default 'open',
  confidence  real,                        -- 0..1 extraction/classification confidence
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tasks_category_idx     on tasks (category);
create index if not exists tasks_status_idx       on tasks (status);
create index if not exists tasks_reminder_at_idx  on tasks (reminder_at);
create index if not exists tasks_source_idx       on tasks (source_type, source_id);

-- keep updated_at fresh -----------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_set_updated_at on tasks;
create trigger tasks_set_updated_at
  before update on tasks
  for each row execute function set_updated_at();

-- Storage buckets -----------------------------------------------------------
-- Original audio + images live in storage; tables only keep the URLs.
insert into storage.buckets (id, name, public)
  values ('voice-notes', 'voice-notes', false)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('images', 'images', false)
  on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- NOTE: This is a single-user personal app, so Row Level Security is left off
-- for the MVP. Before exposing this to multiple users, enable RLS on all three
-- tables and the storage buckets, and scope every row to auth.uid().
-- ----------------------------------------------------------------------------
