# 🐾 SPAA — Site vitrine du refuge animalier

Site vitrine réalisé pour la **SPAA (association de refuge pour animaux)** dans le cadre d'un projet scolaire.

Le projet combine un site public responsive et un **back-office sécurisé** permettant à l'équipe du refuge de gérer les contenus sans modifier directement le code du site.

---

## ✨ Fonctionnalités

### 🌐 Partie publique

- Accueil
- Présentation de l'association
- Animaux à adopter
- Fiches individuelles des animaux
- Galerie de plusieurs photos par animal
- Actualités
- Page détail d'une actualité
- Agenda des événements
- FAQ en accordéon
- Formulaire de contact
- Mentions légales
- Navigation responsive mobile / ordinateur

### 🐶 Gestion des animaux

Les animaux sont stockés dans Supabase.

Chaque fiche peut contenir :

- Nom
- Espèce
- Race
- Âge
- Sexe
- Statut :
  - `Disponible`
  - `Réservé`
  - `Adopté`
- Description
- Plusieurs photos

Les animaux disponibles sont automatiquement affichés sur la page d'accueil.

### 📰 Gestion des actualités

Depuis le back-office, l'équipe peut :

- Ajouter une actualité
- Modifier une actualité
- Supprimer une actualité
- Publier une actualité
- Enregistrer une actualité en brouillon
- Ajouter une image

Les actualités publiées sont automatiquement utilisées sur :

- la page d'accueil ;
- la page `actualites.html` ;
- la page individuelle `actualite.html`.

### 📅 Gestion de l'agenda

L'équipe peut :

- Ajouter un événement
- Modifier un événement
- Supprimer un événement
- Publier / masquer un événement
- Définir une date
- Définir une heure
- Définir un lieu
- Ajouter une description

Le prochain événement à venir peut être affiché automatiquement sur la page d'accueil.

### ❓ Gestion de la FAQ

L'équipe peut :

- Ajouter une question
- Modifier une question
- Supprimer une question
- Publier / masquer une question
- Définir l'ordre d'affichage

Les questions sont affichées sous forme d'accordéon sur `faq.html`.

---

# 🔐 Espace équipe

L'administration est accessible depuis :

```text
/connexion.html
```

puis redirige vers :

```text
/admin.html
```

## 👥 Rôles

Le système utilise trois statuts principaux :

| Rôle | Description |
|---|---|
| `pending` | Compte créé mais en attente de validation |
| `benevole` | Accès équipe pour la gestion des contenus |
| `admin` | Accès administrateur complet |

### Administrateur

Un administrateur peut :

- gérer les animaux ;
- gérer les actualités ;
- gérer l'agenda ;
- gérer la FAQ ;
- gérer les membres de l'équipe ;
- valider les comptes en attente ;
- activer / désactiver un membre ;
- forcer un changement de mot de passe ;
- attribuer le rôle `benevole`.

Les autres comptes `admin` ne sont pas gérables depuis l'interface de gestion des membres.

### Bénévole

Un bénévole peut gérer les contenus du site selon les permissions prévues dans le back-office, mais ne peut pas administrer les comptes de l'équipe.

### Première connexion

Un nouveau membre peut être configuré avec :

```text
must_change_password = true
```

Lors de sa première connexion :

1. le site détecte l'obligation ;
2. l'utilisateur est envoyé vers l'écran de changement de mot de passe ;
3. il saisit son nouveau mot de passe directement sur le site ;
4. aucun lien de changement de mot de passe par e-mail n'est nécessaire ;
5. après validation, l'accès normal au back-office est autorisé.

> Dans le cadre de ce projet scolaire, les adresses e-mail peuvent être fictives. Si la confirmation e-mail Supabase est activée, la création de compte devra néanmoins utiliser un mécanisme d'e-mail valide. Pour un environnement de démonstration, la confirmation e-mail peut être désactivée.

---

# 🗄️ Supabase

Supabase est utilisé pour :

- la base de données ;
- l'authentification ;
- le stockage des images ;
- les règles de sécurité RLS ;
- les fonctions RPC utilisées pour la gestion des rôles et de l'équipe.

## Tables principales

```text
animals
animal_photos
news
events
faq_items
team_members
```

### `animals`

Informations principales des animaux.

### `animal_photos`

Permet d'associer plusieurs photos à un même animal.

### `news`

Stocke les actualités.

### `events`

Stocke les événements de l'agenda.

### `faq_items`

Stocke les questions/réponses de la FAQ.

### `team_members`

Stocke les informations liées aux membres de l'équipe :

- utilisateur Supabase ;
- rôle ;
- activation du compte ;
- obligation de changement de mot de passe.

---

# 📁 Structure du projet

```text
SPAA/
├── index.html
├── actualites.html
├── actualite.html
├── animaux.html
├── animal.html
├── agenda.html
├── faq.html
├── connexion.html
├── admin.html
├── mentions-legales.html
│
├── CSS/
│   └── styles.css
│
├── JS/
│   ├── script.js
│   ├── supabase.js
│   ├── connexion.js
│   ├── admin.js
│   ├── roles.js
│   ├── animaux.js
│   ├── animal.js
│   ├── animaux-home.js
│   ├── actualites.js
│   ├── actualites-home.js
│   ├── agenda.js
│   ├── agenda-home.js
│   ├── faq.js
│   └── faq-home.js
│
├── SQL_setup.sql
└── README.md
```

---

# 🚀 Installation

## 1. Cloner le projet

```bash
git clone https://github.com/TON-COMPTE/TON-DEPOT.git
cd SPAA
```

## 2. Configurer Supabase

Créer un projet Supabase puis ouvrir :

```text
SQL Editor
```

Exécuter :

```text
SQL_setup.sql
```

Ce script crée les tables, les index, les politiques RLS, les buckets Storage et les fonctions nécessaires au fonctionnement du projet.

## 3. Configurer la connexion Supabase

Dans :

```text
JS/supabase.js
```

renseigner :

```javascript
const SUPABASE_URL = "https://TON-PROJET.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "TA_CLE_PUBLISHABLE";
```

⚠️ Utiliser uniquement une **publishable key** côté navigateur.

Ne jamais placer une clé :

```text
sb_secret_...
service_role
```

dans le code frontend ou dans GitHub.

## 4. Déployer sur Vercel

Le projet étant constitué de fichiers HTML/CSS/JS statiques, il peut être déployé directement depuis GitHub avec Vercel.

### Déploiement

1. Importer le dépôt GitHub dans Vercel.
2. Sélectionner le projet.
3. Aucun build complexe n'est nécessaire pour le site statique.
4. Déployer.

Vercel redéploiera automatiquement le site lors des nouveaux `push` sur la branche configurée.

---

# 🧪 Compte administrateur

Pour préparer le premier administrateur, créer d'abord l'utilisateur dans :

```text
Supabase
→ Authentication
→ Users
```

Puis créer ou modifier son entrée dans :

```text
public.team_members
```

Exemple :

```sql
UPDATE public.team_members tm
SET
  role = 'admin',
  active = true,
  must_change_password = false
FROM auth.users u
WHERE tm.user_id = u.id
  AND u.email = 'admin@spaa.fr';
```

Pour imposer un changement du mot de passe à la prochaine connexion :

```sql
UPDATE public.team_members tm
SET
  role = 'admin',
  active = true,
  must_change_password = true
FROM auth.users u
WHERE tm.user_id = u.id
  AND u.email = 'admin@spaa.fr';
```

---

# 🔒 Sécurité

Le projet utilise Supabase Authentication et RLS.

Les contrôles liés aux rôles et à la gestion de l'équipe sont réalisés côté base de données lorsqu'ils passent par les fonctions prévues.

Le frontend ne doit jamais être considéré comme la seule couche de sécurité.

Fonctions utilisées pour la gestion de l'équipe :

```text
is_current_user_admin
admin_list_team_members
admin_update_team_member
complete_first_login
```

---

# 📄 Mentions légales

La page :

```text
mentions-legales.html
```

présente les informations légales du site.

Les informations officielles de l'association doivent être vérifiées avant une éventuelle mise en ligne réelle.

---

# 🎨 Identité visuelle

Le site utilise une identité graphique chaleureuse basée notamment sur :

- orange ;
- vert ;
- brun foncé ;
- fond crème ;
- typographie serif pour les titres ;
- typographie sans-serif pour les textes.

L'objectif est de conserver une image chaleureuse, rassurante et adaptée à un refuge animalier.

---

# 📱 Responsive

Le site est prévu pour fonctionner sur :

- ordinateur ;
- tablette ;
- smartphone.

La navigation et les cartes de contenu s'adaptent automatiquement aux différentes tailles d'écran.

---

# 🎓 Contexte du projet

Projet réalisé dans le cadre d'un projet scolaire de conception et développement d'un site vitrine pour une association de refuge animalier.

Le projet s'appuie sur une conception comprenant :

- une partie publique ;
- des fiches animaux ;
- des actualités ;
- un agenda ;
- une FAQ ;
- un espace équipe ;
- un back-office ;
- une gestion des rôles ;
- une authentification.

---

## 📌 Statut

**Projet scolaire — version de développement**

```text
Frontend : HTML / CSS / JavaScript
Backend / BDD : Supabase
Authentification : Supabase Auth
Stockage images : Supabase Storage
Hébergement : Vercel
Versioning : GitHub
```

---

## 👤 Référent association

**Alexis Le Fort — Président**

E-mail de contact du projet :

```text
contact@spaa.fr
```
