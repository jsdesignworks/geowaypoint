-- Section 4 core tables + RLS (GeoWaypoint spec). No inferred tables.

-- Resorts (one per paying customer)
create table public.resorts (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references auth.users(id) on delete cascade,
  name        text not null,
  slug        text unique not null,
  phone       text,
  logo_url    text,
  plan        text not null default 'starter',
  trial_ends_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at  timestamptz default now()
);

alter table public.resorts enable row level security;

create policy "owner access" on public.resorts
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Maps (many per resort)
create table public.maps (
  id          uuid primary key default gen_random_uuid(),
  resort_id   uuid references public.resorts(id) on delete cascade,
  name        text not null default 'New Map',
  image_url   text,
  is_published boolean default false,
  created_at  timestamptz default now()
);

alter table public.maps enable row level security;

create policy "resort owner access" on public.maps
  for all
  using (resort_id in (select id from public.resorts where owner_id = auth.uid()))
  with check (resort_id in (select id from public.resorts where owner_id = auth.uid()));

-- Sites (markers on a map)
create table public.sites (
  id          uuid primary key default gen_random_uuid(),
  map_id      uuid references public.maps(id) on delete cascade,
  resort_id   uuid references public.resorts(id) on delete cascade,
  name        text not null,
  site_type   text,
  status      text default 'available',
  rate_night  numeric(8,2),
  max_length_ft int,
  amenities   text[],
  description text,
  photo_url   text,
  pos_x       numeric(5,2),
  pos_y       numeric(5,2),
  ownerrez_property_id text,
  created_at  timestamptz default now()
);

alter table public.sites enable row level security;

create policy "resort owner access" on public.sites
  for all
  using (resort_id in (select id from public.resorts where owner_id = auth.uid()))
  with check (resort_id in (select id from public.resorts where owner_id = auth.uid()));

-- OwnerRez tokens (one per resort)
create table public.ownerrez_tokens (
  resort_id       uuid primary key references public.resorts(id) on delete cascade,
  access_token    text not null,
  connected_at    timestamptz default now(),
  last_synced_at  timestamptz
);

alter table public.ownerrez_tokens enable row level security;

create policy "owner only" on public.ownerrez_tokens
  for all
  using (resort_id in (select id from public.resorts where owner_id = auth.uid()))
  with check (resort_id in (select id from public.resorts where owner_id = auth.uid()));

-- Team members
create table public.team_members (
  id          uuid primary key default gen_random_uuid(),
  resort_id   uuid references public.resorts(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  role        text not null default 'editor',
  invited_at  timestamptz default now(),
  accepted_at timestamptz
);

alter table public.team_members enable row level security;

create policy "resort owner access" on public.team_members
  for all
  using (resort_id in (select id from public.resorts where owner_id = auth.uid()))
  with check (resort_id in (select id from public.resorts where owner_id = auth.uid()));
