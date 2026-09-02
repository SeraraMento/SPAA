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
-- 2. Comptes équipe & rôles
-- ------------------------------------------------------------
create table if not exists public.team_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'pending'
    check (role in ('pending', 'benevole', 'admin')),
  created_at timestamptz not null default now()
);

create index if not exists team_members_role_idx on public.team_members(role);

alter table public.team_members enable row level security;

-- Fonction de lecture du rôle courant. SECURITY DEFINER évite les problèmes de récursion RLS.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.team_members where user_id = auth.uid();
$$;

-- À chaque nouvelle inscription, le compte est créé en "pending".
-- Il n'a donc aucun droit d'administration tant qu'un administrateur ne l'a pas validé.
create or replace function public.handle_new_user_team_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.team_members (user_id, role)
  values (new.id, 'pending')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_team_member on auth.users;
create trigger on_auth_user_created_team_member
after insert on auth.users
for each row execute function public.handle_new_user_team_member();

-- Crée aussi une entrée pour les comptes déjà existants lors de la migration.
insert into public.team_members (user_id, role)
select id, 'pending' from auth.users
on conflict (user_id) do nothing;

-- L'utilisateur peut lire son propre statut. Un admin peut lire tous les membres.
drop policy if exists "Team member can read own role" on public.team_members;
create policy "Team member can read own role"
on public.team_members
for select
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "Admins can manage team members" on public.team_members;
create policy "Admins can manage team members"
on public.team_members
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

-- ------------------------------------------------------------
-- 3. Sécurité RLS des animaux
-- ------------------------------------------------------------
alter table public.animals enable row level security;

drop policy if exists "Public can read animals" on public.animals;
create policy "Public can read animals"
on public.animals
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated can insert animals" on public.animals;
create policy "Team can insert animals"
on public.animals
for insert
to authenticated
with check (public.current_user_role() in ('admin', 'benevole'));

drop policy if exists "Authenticated can update animals" on public.animals;
create policy "Team can update animals"
on public.animals
for update
to authenticated
using (public.current_user_role() in ('admin', 'benevole'))
with check (public.current_user_role() in ('admin', 'benevole'));

drop policy if exists "Authenticated can delete animals" on public.animals;
create policy "Admins can delete animals"
on public.animals
for delete
to authenticated
using (public.current_user_role() = 'admin');

-- ------------------------------------------------------------
-- 4. Storage : photos des animaux
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
create policy "Team can upload animal photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'animal-photos' and public.current_user_role() in ('admin', 'benevole'));

drop policy if exists "Authenticated can update animal photos" on storage.objects;
create policy "Team can update animal photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'animal-photos' and public.current_user_role() in ('admin', 'benevole'))
with check (bucket_id = 'animal-photos' and public.current_user_role() in ('admin', 'benevole'));

drop policy if exists "Authenticated can delete animal photos" on storage.objects;
create policy "Admins can delete animal photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'animal-photos' and public.current_user_role() = 'admin');

-- ------------------------------------------------------------
-- 5. Quelques animaux de démonstration (facultatif)
-- Décommente le bloc si tu veux voir immédiatement le rendu.
-- ------------------------------------------------------------
-- insert into public.animals (name, species, breed, age, sex, status, description)
-- values
-- ('Rex', 'Chien', 'Croisé Labrador', '3 ans', 'Mâle', 'available', 'Joueur et sociable, à l’aise avec les enfants et les autres chiens.'),
-- ('Nala', 'Chat', 'Européenne', '2 ans', 'Femelle', 'available', 'Câline et discrète, elle s’épanouit dans un foyer calme.'),
-- ('Milo', 'Chien', 'Croisé Beagle', '1 an', 'Mâle', 'reserved', 'Énergique, il adore les longues balades et la compagnie.');
