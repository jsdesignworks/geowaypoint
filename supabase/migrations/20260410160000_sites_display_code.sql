-- Optional short label for guest map markers (e.g. A1, B2)
alter table public.sites add column if not exists display_code text;
