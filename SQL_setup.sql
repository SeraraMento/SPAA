-- ============================================================
-- SPAA — Première installation Supabase
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. Table des animaux
-- ------------------------------------------------------------
create table if not exists public.animals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  species text not null default 'Chien',
  breed text,
  age text,
  sex text,
  status text not null default 'available'
    check (status in ('available', 'reserved', 'adopted')),
  description text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists animals_status_idx on public.animals(status);
create index if not exists animals_created_at_idx on public.animals(created_at desc);

-- Mise à jour automatique de updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists animals_set_updated_at on public.animals;
create trigger animals_set_updated_at
before update on public.animals
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 2. Sécurité RLS
-- ------------------------------------------------------------
alter table public.animals enable row level security;

drop policy if exists "Public can read animals" on public.animals;
create policy "Public can read animals"
on public.animals
for select
to anon, authenticated
using (true);

-- Pour la V1, tout compte authentifié est considéré comme membre du back-office.
-- On pourra ensuite ajouter une table admin_users avec des rôles plus fins.
drop policy if exists "Authenticated can insert animals" on public.animals;
create policy "Authenticated can insert animals"
on public.animals
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated can update animals" on public.animals;
create policy "Authenticated can update animals"
on public.animals
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can delete animals" on public.animals;
create policy "Authenticated can delete animals"
on public.animals
for delete
 to authenticated
using (true);

-- ------------------------------------------------------------
-- 3. Storage : photos des animaux
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('animal-photos', 'animal-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view animal photos" on storage.objects;
create policy "Public can view animal photos"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'animal-photos');

drop policy if exists "Authenticated can upload animal photos" on storage.objects;
create policy "Authenticated can upload animal photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'animal-photos');

drop policy if exists "Authenticated can update animal photos" on storage.objects;
create policy "Authenticated can update animal photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'animal-photos')
with check (bucket_id = 'animal-photos');

drop policy if exists "Authenticated can delete animal photos" on storage.objects;
create policy "Authenticated can delete animal photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'animal-photos');

-- ------------------------------------------------------------
-- 4. Quelques animaux de démonstration (facultatif)
-- Décommente le bloc si tu veux voir immédiatement le rendu.
-- ------------------------------------------------------------
-- insert into public.animals (name, species, breed, age, sex, status, description)
-- values
-- ('Rex', 'Chien', 'Croisé Labrador', '3 ans', 'Mâle', 'available', 'Joueur et sociable, à l’aise avec les enfants et les autres chiens.'),
-- ('Nala', 'Chat', 'Européenne', '2 ans', 'Femelle', 'available', 'Câline et discrète, elle s’épanouit dans un foyer calme.'),
-- ('Milo', 'Chien', 'Croisé Beagle', '1 an', 'Mâle', 'reserved', 'Énergique, il adore les longues balades et la compagnie.');


-- ------------------------------------------------------------
-- Photos multiples des animaux
-- ------------------------------------------------------------
create table if not exists public.animal_photos (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals(id) on delete cascade,
  photo_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists animal_photos_animal_idx on public.animal_photos(animal_id, sort_order, created_at);

alter table public.animal_photos enable row level security;

drop policy if exists "Public can read animal photos" on public.animal_photos;
create policy "Public can read animal photos" on public.animal_photos for select to anon, authenticated using (true);

drop policy if exists "Authenticated can manage animal photos" on public.animal_photos;
create policy "Authenticated can manage animal photos" on public.animal_photos for all to authenticated using (true) with check (true);

-- ============================================================
-- SPAA — Actualités
-- À exécuter après la première installation
-- ============================================================
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text,
  content text not null,
  image_url text,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists news_published_idx on public.news(published);
create index if not exists news_published_at_idx on public.news(published_at desc);
drop trigger if exists news_set_updated_at on public.news;
create trigger news_set_updated_at before update on public.news for each row execute function public.set_updated_at();
alter table public.news enable row level security;
drop policy if exists "Public can read published news" on public.news;
create policy "Public can read published news" on public.news for select to anon, authenticated using (published = true);
drop policy if exists "Authenticated can manage news" on public.news;
create policy "Authenticated can manage news" on public.news for all to authenticated using (true) with check (true);
insert into storage.buckets (id,name,public) values ('news-images','news-images',true) on conflict (id) do update set public=true;
drop policy if exists "Public can view news images" on storage.objects;
create policy "Public can view news images" on storage.objects for select to anon, authenticated using (bucket_id='news-images');
drop policy if exists "Authenticated can upload news images" on storage.objects;
create policy "Authenticated can upload news images" on storage.objects for insert to authenticated with check (bucket_id='news-images');
drop policy if exists "Authenticated can update news images" on storage.objects;
create policy "Authenticated can update news images" on storage.objects for update to authenticated using (bucket_id='news-images') with check (bucket_id='news-images');
drop policy if exists "Authenticated can delete news images" on storage.objects;
create policy "Authenticated can delete news images" on storage.objects for delete to authenticated using (bucket_id='news-images');
