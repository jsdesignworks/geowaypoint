-- Analytics events from embed (spec §10); inserts via service role / trusted API only.
create table public.embed_events (
  id          uuid primary key default gen_random_uuid(),
  resort_id   uuid not null references public.resorts(id) on delete cascade,
  map_id      uuid not null references public.maps(id) on delete cascade,
  site_id     uuid references public.sites(id) on delete set null,
  event       text not null,
  created_at  timestamptz not null default now()
);

create index embed_events_resort_created on public.embed_events (resort_id, created_at desc);

alter table public.embed_events enable row level security;

create policy "resort owner read embed_events" on public.embed_events
  for select
  using (resort_id in (select id from public.resorts where owner_id = auth.uid()));
