# PawManager — Tout pour leur bien-être, au même endroit.

PWA React + TypeScript + Tailwind pour gérer la vie et la santé de ses chiens.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests unitaires (calculs, rappels, i18n)
npm run build
```

## Choix d'architecture
- **Vite + React 19 + TS + Tailwind 3** : PWA légère (manifest + service worker), pas de SSR nécessaire.
- **Couche de données unique (`src/lib/repo.ts`)** avec deux implémentations réelles :
  - `cloudRepo` → Supabase (Auth + PostgreSQL + RLS), actif si `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` sont définies ;
  - `localRepo` → `localStorage` de l'appareil (mode local, **non synchronisé, non chiffré**), sinon.
  - Le mode démo est en mémoire uniquement.
- **Thèmes** (5), **langues** (FR, EN, ES, DE ; le français sert de repli), **monnaies** (EUR, USD, GBP, CHF, CAD, JPY) : réglables dans Profil.
  Les montants sont **formatés** dans la monnaie choisie mais **jamais convertis** (aucun taux de change).
- Dates stockées en heure locale (`yyyy-mm-dd`, `yyyy-mm-ddTHH:mm`), sans conversion UTC.

## Activer le cloud (Supabase)
1. Créer un projet Supabase, exécuter `supabase/migrations/0001_init.sql` (tables, RLS par `auth.uid()`, bucket privé `documents`, limite Free = 1 chien côté serveur, fonction d'effacement RGPD).
2. Copier `.env.example` en `.env.local` et renseigner URL + clé *anon*.
3. Auth > URL Configuration : ajouter l'URL de l'app (réinitialisation du mot de passe).

## État réel des fonctionnalités
| Fonction | État |
|---|---|
| Accueil (revue, vue du jour, indicateur de complétude, chronologie cliquable, actions rapides) | ✅ fonctionnel |
| Multi-chiens, changement instantané | ✅ |
| Carnet de santé : vaccins, antiparasitaires, traitements, allergies/antécédents (observation perso ≠ confirmé pro), rendez-vous | ✅ |
| Poids + courbe + variation ; note « chiot » | ✅ (taille adulte estimée : non fait) |
| Alimentation (repas), activités, routines activables, stats hebdo | ✅ (rappel de réapprovisionnement : non fait) |
| Dépenses : mois/année/moyenne/catégories/mois par mois/par chien/budget | ✅ calculées sur les données réelles |
| Notifications de rendez-vous | ✅ via Notification API **application ouverte/installée** ; push application fermée = non configuré |
| Thèmes / langues / monnaies | ✅ |
| Auth Supabase (inscription, connexion, mot de passe oublié) | ⚠️ codé, **non testé** (aucune clé Supabase dans cet environnement) |
| Suppression de compte | ❌ à faire (Edge Function) ; suppression des données : ✅ |
| Export des données (JSON) | ✅ |
| Documents (import, aperçu, stockage privé) | ❌ bucket + RLS prêts, UI à faire |
| Export PDF du dossier de santé | ❌ à faire |
| Calendrier centralisé, recherche globale, historique filtrable | ❌ à faire |
| Premium / Stripe | ❌ **aucun paiement** : `profiles.plan` est protégé par RLS, à écrire uniquement par un webhook Stripe (service role). Limite Free = 1 chien côté client **et** par trigger SQL en mode cloud ; en mode local elle n'est qu'indicative. |
| Landing page, page des offres | ❌ à faire |

## Tests exécutés
- `npm test` : 8 tests unitaires (totaux de dépenses, variation de poids, « Données insuffisantes », fenêtre de rappel, i18n).
- Parcours navigateur (Chromium/Playwright, mobile 390 px) : création de chien, pesée, dépense, validation d'erreur, persistance après rechargement, changement de langue/monnaie/thème, démo étiquetée.
- **Non testés** : isolation entre deux comptes (RLS), Auth Supabase, tablette, lecteurs d'écran.
