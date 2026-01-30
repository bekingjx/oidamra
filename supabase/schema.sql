-- OIDAMRA schema
-- Run inside Supabase SQL editor

create extension if not exists "pgcrypto";

create table if not exists garments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  category text not null,
  color text not null,
  seasons text[],
  brand text,
  fabric text,
  size text,
  formality text,
  occasions text[],
  created_at timestamptz not null default now()
);

create table if not exists garment_photos (
  id uuid primary key default gen_random_uuid(),
  garment_id uuid not null references garments(id) on delete cascade,
  path text not null,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_public boolean not null default false,
  share_id uuid unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists outfit_items (
  id uuid primary key default gen_random_uuid(),
  outfit_id uuid not null references outfits(id) on delete cascade,
  garment_id uuid not null references garments(id) on delete cascade,
  slot text,
  placement text default 'slot',
  position jsonb,
  layer integer default 0,
  created_at timestamptz not null default now()
);

-- Safe alter statements for existing projects (run before indexes/policies)
alter table if exists garments
  add column if not exists brand text,
  add column if not exists fabric text,
  add column if not exists size text,
  add column if not exists formality text,
  add column if not exists occasions text[];

alter table if exists outfits
  add column if not exists is_public boolean not null default false,
  add column if not exists share_id uuid default gen_random_uuid();

create index if not exists garments_user_id_idx on garments(user_id);
create index if not exists garment_photos_garment_id_idx on garment_photos(garment_id);
create index if not exists outfits_user_id_idx on outfits(user_id);
create unique index if not exists outfits_share_id_idx on outfits(share_id);
create index if not exists outfit_items_outfit_id_idx on outfit_items(outfit_id);

alter table garments enable row level security;
alter table garment_photos enable row level security;
alter table outfits enable row level security;
alter table outfit_items enable row level security;

create policy "garments_select_own" on garments
  for select using (auth.uid() = user_id);
create policy "garments_insert_own" on garments
  for insert with check (auth.uid() = user_id);
create policy "garments_update_own" on garments
  for update using (auth.uid() = user_id);
create policy "garments_delete_own" on garments
  for delete using (auth.uid() = user_id);

create policy "garment_photos_select_own" on garment_photos
  for select using (
    exists (
      select 1 from garments g
      where g.id = garment_photos.garment_id
        and g.user_id = auth.uid()
    )
  );
create policy "garment_photos_select_public_outfits" on garment_photos
  for select using (
    exists (
      select 1
      from outfit_items oi
      join outfits o on o.id = oi.outfit_id
      where oi.garment_id = garment_photos.garment_id
        and o.is_public = true
    )
  );
create policy "garment_photos_insert_own" on garment_photos
  for insert with check (
    exists (
      select 1 from garments g
      where g.id = garment_photos.garment_id
        and g.user_id = auth.uid()
    )
  );
create policy "garment_photos_delete_own" on garment_photos
  for delete using (
    exists (
      select 1 from garments g
      where g.id = garment_photos.garment_id
        and g.user_id = auth.uid()
    )
  );

create policy "outfits_select_own" on outfits
  for select using (auth.uid() = user_id);
create policy "outfits_select_public" on outfits
  for select using (is_public = true);
create policy "outfits_insert_own" on outfits
  for insert with check (auth.uid() = user_id);
create policy "outfits_update_own" on outfits
  for update using (auth.uid() = user_id);
create policy "outfits_delete_own" on outfits
  for delete using (auth.uid() = user_id);

create policy "outfit_items_select_own" on outfit_items
  for select using (
    exists (
      select 1 from outfits o
      where o.id = outfit_items.outfit_id
        and o.user_id = auth.uid()
    )
  );
create policy "outfit_items_select_public" on outfit_items
  for select using (
    exists (
      select 1 from outfits o
      where o.id = outfit_items.outfit_id
        and o.is_public = true
    )
  );

create policy "garments_select_public_outfits" on garments
  for select using (
    exists (
      select 1
      from outfit_items oi
      join outfits o on o.id = oi.outfit_id
      where oi.garment_id = garments.id
        and o.is_public = true
    )
  );
create policy "outfit_items_insert_own" on outfit_items
  for insert with check (
    exists (
      select 1 from outfits o
      where o.id = outfit_items.outfit_id
        and o.user_id = auth.uid()
    )
  );
create policy "outfit_items_delete_own" on outfit_items
  for delete using (
    exists (
      select 1 from outfits o
      where o.id = outfit_items.outfit_id
        and o.user_id = auth.uid()
    )
  );

-- Storage policies are configured in supabase/storage.sql
