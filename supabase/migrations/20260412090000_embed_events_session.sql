-- Phase 3: session grouping for click-path analytics (spec §10).
alter table public.embed_events
  add column if not exists session_id text,
  add column if not exists client_seq bigint;

comment on column public.embed_events.session_id is 'Client-generated id; groups events for session / click-path views.';
comment on column public.embed_events.client_seq is 'Optional monotonic ordering hint from the client within a session.';

create index if not exists embed_events_session_created
  on public.embed_events (session_id, created_at desc)
  where session_id is not null;

create index if not exists embed_events_resort_session
  on public.embed_events (resort_id, session_id)
  where session_id is not null;
