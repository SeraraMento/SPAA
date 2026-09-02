# SPAA — intégration Supabase V2 (comptes + rôles)

## 1. Installer / mettre à jour la base

Dans **Supabase > SQL Editor**, exécuter `SQL_setup.sql` en entier.

Le script crée :
- `public.animals`
- `public.team_members` avec les rôles `pending`, `benevole`, `admin`
- un trigger qui place automatiquement tout nouveau compte en `pending`
- les règles RLS adaptées aux rôles
- le bucket Storage `animal-photos`

## 2. Très important : aucun nouveau compte n'est admin

Lorsqu'une personne utilise **Créer un compte**, son rôle est automatiquement :

`pending`

Elle peut donc créer son compte, mais ne peut pas gérer les animaux ni accéder au back-office tant qu'un administrateur ne l'a pas validée.

## 3. Créer le premier administrateur

Après avoir créé le premier compte depuis `connexion.html`, exécuter dans Supabase SQL Editor :

```sql
update public.team_members tm
set role = 'admin'
from auth.users u
where tm.user_id = u.id
  and u.email = 'TON-EMAIL-ADMIN@exemple.fr';
```

Remplacer l'adresse par celle du responsable.

Ensuite, ce compte peut être utilisé pour administrer le site.

## 4. Donner l'accès bénévole à un compte

Un administrateur peut valider un compte en exécutant :

```sql
update public.team_members tm
set role = 'benevole'
from auth.users u
where tm.user_id = u.id
  and u.email = 'EMAIL-DU-BENEVOLE@exemple.fr';
```

## 5. Rôles

- `pending` : compte créé mais pas encore validé, aucun accès au back-office.
- `benevole` : peut ajouter et modifier les animaux.
- `admin` : accès équipe complet et suppression des animaux.

La création de compte publique ne donne donc jamais automatiquement le rôle `admin`.
