drop policy if exists "banners_upload_self" on storage.objects;
create policy "banners_upload_self"
on storage.objects for insert
with check (
  bucket_id = 'banners'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "banners_update_self" on storage.objects;
create policy "banners_update_self"
on storage.objects for update
using (
  bucket_id = 'banners'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'banners'
  and auth.uid()::text = (storage.foldername(name))[1]
);
