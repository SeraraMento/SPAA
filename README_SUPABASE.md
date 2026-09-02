# SPAA — intégration Supabase

## 1. Installer la base

1. Ouvrir le projet Supabase.
2. Aller dans **SQL Editor**.
3. Ouvrir `SQL_setup.sql`.
4. Exécuter tout le script.

Le script crée :
- `public.animals`
- les politiques RLS de lecture publique et d'écriture authentifiée
- le bucket Storage `animal-photos`
- les politiques Storage associées

## 2. Créer le premier compte administrateur

Dans Supabase : **Authentication > Users > Add user**.

Créer l'adresse e-mail et le mot de passe du responsable du refuge.

Puis ouvrir `admin.html` sur le site et se connecter.

> V1 : tout utilisateur authentifié dispose des droits du back-office. Avant la mise en production, il est recommandé de remplacer cette règle par une vraie table de rôles (`admin`, `benevole`).

## 3. Fonctionnement

- Les visiteurs voient automatiquement les animaux `available` sur la page d'accueil.
- L'administrateur peut créer/modifier/supprimer un animal.
- Une photo peut être envoyée dans Supabase Storage.
- Les données sont ensuite réutilisées par la future page `/animaux`.

## Sécurité

La clé présente dans `JS/supabase.js` est une **publishable key**. Elle peut être utilisée côté navigateur ; les permissions réelles sont contrôlées par RLS.

Ne jamais remplacer cette clé par une clé `sb_secret_...` ou `service_role` dans le navigateur.
\n## Agenda\nLa table `events` est créée par `SQL_setup.sql`. L'administration permet d'ajouter, modifier, publier et supprimer les événements. La page `agenda.html` affiche les événements publiés et l'accueil affiche automatiquement le prochain événement à venir.\nEOF

# zip
cd /mnt/data/spaa_agenda_work && zip -qr ../SPAA_Supabase_Agenda_V1.zip . -x '*.DS_Store'
ls -lh ../SPAA_Supabase_Agenda_V1.zip


## FAQ

La V1 ajoute une table `faq_items` dans `SQL_setup.sql`.

- `faq.html` affiche toutes les questions publiées sous forme d'accordéon.
- `index.html` affiche les 4 premières questions publiées.
- `admin.html` permet d'ajouter, modifier, publier/brouillon et supprimer les questions.
- Le champ `sort_order` permet de choisir l'ordre d'affichage.

Après mise à jour du projet, exécuter `SQL_setup.sql` dans Supabase si la table `faq_items` n'existe pas encore.
