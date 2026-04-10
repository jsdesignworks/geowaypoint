-- Public map images; object path prefix must be `{auth.uid()}/...` so owners cannot write others' keys.
insert into storage.buckets (id, name, public)
values ('maps', 'maps', true)
on conflict (id) do nothing;

create policy "maps_select_public"
  on storage.objects for select
  using (bucket_id = 'maps');

create policy "maps_insert_own_folder"
  on storage.objects for insert
  with check (
    bucket_id = 'maps'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "maps_update_own_folder"
  on storage.objects for update
  using (
    bucket_id = 'maps'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'maps'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "maps_delete_own_folder"
  on storage.objects for delete
  using (
    bucket_id = 'maps'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
