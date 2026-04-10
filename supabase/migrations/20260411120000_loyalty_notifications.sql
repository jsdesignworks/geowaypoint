-- Spec §14 loyalty fields; §17 notifications (per-resort owner feed).
alter table public.resorts
  add column if not exists loyalty_tier text,
  add column if not exists referred_by text;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  category text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications own rows" on public.notifications
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists notifications_user_created on public.notifications (user_id, created_at desc);
