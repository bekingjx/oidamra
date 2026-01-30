-- Storage policies for garment-photos bucket
-- Create a public bucket named "garment-photos" in Supabase Storage first.

alter table storage.objects enable row level security;

create policy "garment_photos_public_read" on storage.objects
  for select using (bucket_id = 'garment-photos');

create policy "garment_photos_insert_own" on storage.objects
  for insert with check (bucket_id = 'garment-photos' and auth.uid() = owner);

create policy "garment_photos_update_own" on storage.objects
  for update using (bucket_id = 'garment-photos' and auth.uid() = owner);

create policy "garment_photos_delete_own" on storage.objects
  for delete using (bucket_id = 'garment-photos' and auth.uid() = owner);
