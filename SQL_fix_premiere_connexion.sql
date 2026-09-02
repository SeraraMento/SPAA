-- SPAA — Correctif première connexion / changement de mot de passe
-- À exécuter dans Supabase > SQL Editor si le changement sur le site ne finalise pas le compte.

create or replace function public.complete_first_login()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Utilisateur non authentifié.';
  end if;

  update public.team_members
  set must_change_password = false,
      updated_at = now()
  where user_id = auth.uid();

  if not found then
    raise exception 'Profil équipe introuvable pour l’utilisateur connecté.';
  end if;
end;
$$;

revoke all on function public.complete_first_login() from public;
grant execute on function public.complete_first_login() to authenticated;

-- Vérification optionnelle : doit retourner la fonction.
-- select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
-- where n.nspname='public' and p.proname='complete_first_login';
