-- Phase 5: show OwnerRez embed/settings only when resort opts in
alter table public.resorts add column if not exists ownerrez_integration_enabled boolean not null default false;

comment on column public.resorts.ownerrez_integration_enabled is
  'When true, OwnerRez UI (embed page, connection) is shown for this resort.';
