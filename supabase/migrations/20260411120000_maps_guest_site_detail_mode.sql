-- Phase 2: guest map unit detail presentation (popup vs sidebar)
alter table public.maps add column if not exists guest_site_detail_mode text not null default 'popup';

alter table public.maps drop constraint if exists maps_guest_site_detail_mode_check;
alter table public.maps
  add constraint maps_guest_site_detail_mode_check
  check (guest_site_detail_mode in ('popup', 'sidebar'));

comment on column public.maps.guest_site_detail_mode is 'Guest widget: site detail as floating popup or side panel';
