# SECUREXIA — Guide d'installation production (Supabase + Vercel)

Ce guide te fait passer de **« app déployée sur Vercel mais sans données »** à
**« app fonctionnelle avec connexion email/mot de passe + 6 ERP de démo »**.

À prévoir : ~30 minutes.

---

## Étape 1 — Créer le projet Supabase (5 min)

1. Aller sur https://supabase.com → **Sign in** (GitHub conseillé) → **New project**
2. Renseigner :
   - **Name** : `securexia-prod`
   - **Database Password** : génère un mot de passe fort, **note-le**, tu en auras besoin
   - **Region** : **Europe West (Frankfurt)** — obligatoire pour respecter le RGPD français
   - Plan : Free (suffisant pour démarrer)
3. Cliquer **Create new project** et attendre 2 min que le projet provisionne.

---

## Étape 2 — Récupérer les 5 clés (5 min)

Dans le projet Supabase, dans la **sidebar gauche** :

### A. Project URL + clés API
**Settings** (icône engrenage) → **API**

Note ces 3 valeurs :
- **Project URL** → `https://xxxxxxxx.supabase.co`
- **anon / public** key → `eyJ...` (longue chaîne)
- **service_role** key → `eyJ...` (autre longue chaîne — ⚠ secrète, jamais côté client)

### B. Connection strings PostgreSQL
**Settings** → **Database** → section **Connection string**

- Onglet **Transaction (port 6543)** → copie-la, ce sera `DATABASE_URL`
- Onglet **Session (port 5432)** → copie-la, ce sera `DIRECT_URL`

Dans les deux, remplace `[YOUR-PASSWORD]` par le mot de passe de l'étape 1.

---

## Étape 3 — Configurer les variables d'environnement (10 min)

### A. En local (pour pouvoir lancer le seed)

Dans le dossier du projet :
```bash
cp .env.example .env.local
```

Édite `.env.local` et colle les 5 valeurs récupérées :
```env
DATABASE_URL=postgresql://postgres.xxx:MON_PWD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxx:MON_PWD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### B. Sur Vercel

Dans le dashboard Vercel → ton projet **securexia** → **Settings** → **Environment Variables**

Ajoute exactement les 5 mêmes variables ci-dessus, **pour les 3 environnements** (Production, Preview, Development) :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | la connection string port **6543** |
| `DIRECT_URL` | la connection string port **5432** |
| `NEXT_PUBLIC_SUPABASE_URL` | l'URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la clé anon |
| `SUPABASE_SERVICE_ROLE_KEY` | la clé service_role |

Pour `NEXT_PUBLIC_APP_URL`, mettre l'URL Vercel (ex. `https://securexia.vercel.app`) côté Production.

---

## Étape 4 — Pousser le schéma de base de données (2 min)

Toujours en local, dans le dossier du projet :
```bash
npm install              # si pas déjà fait
npx prisma db push       # crée les 16 tables dans Supabase
```

Tu dois voir `🚀 Your database is now in sync with your Prisma schema.`

---

## Étape 5 — Charger les données de démo + créer les comptes (3 min)

```bash
npm run db:seed
```

Cette commande :
- crée 1 client (Ville des Abymes), 6 ERP, et les prescriptions du PV de Boisvin
- crée 3 comptes Supabase Auth (consultant / admin / lecteur)

À la fin, tu verras les **identifiants de connexion** dans le terminal :

```
🔐 Comptes Supabase Auth créés :
   - consultant@securexia.fr  ·  rôle consultant  ·  mot de passe : Demo!1234
   - dst@abymes.gp            ·  rôle admin       ·  mot de passe : Demo!1234
   - elu@abymes.gp            ·  rôle lecteur     ·  mot de passe : Demo!1234
```

> **⚠ Important** : ces comptes ont tous le mot de passe `Demo!1234`. Va dans
> **Supabase Dashboard → Authentication → Users** pour changer leurs mots de
> passe (clic sur l'utilisateur → « Send password recovery » ou « Update password »)
> avant de partager l'app.

---

## Étape 6 — Redéployer Vercel (1 min)

Dans le dashboard Vercel → ton projet → **Deployments** → clic sur les 3 points
du dernier déploiement → **Redeploy** (sans cocher « use cache »).

OU plus simple : pousse n'importe quel commit sur la branche `main`, Vercel
redéploie automatiquement.

---

## Étape 7 — Tester

1. Ouvre ton URL Vercel (ex. `https://securexia.vercel.app`)
2. Tu es redirigé vers `/login`
3. Connecte-toi avec :
   - email : `consultant@securexia.fr`
   - mot de passe : `Demo!1234`
4. Tu arrives sur le dashboard avec :
   - 6 ERP listés
   - les prescriptions du Groupe Scolaire de Boisvin
   - les KPIs calculés

🎉

---

## Dépannage

### « Erreur Prisma : can't reach database »
Vérifie que `DATABASE_URL` dans Vercel pointe bien sur le **port 6543** (pooler) et pas 5432.

### « Identifiants incorrects »
Si tu n'as pas vu les comptes créés à l'étape 5 :
- Vérifie que `SUPABASE_SERVICE_ROLE_KEY` est bien dans `.env.local` localement
- Relance `npm run db:seed`

Sinon, tu peux créer un compte manuellement dans **Supabase Dashboard → Authentication → Add User**, puis dans **Table Editor → users** lier son `auth_id` à un utilisateur Prisma existant.

### Le bouton « Se connecter » tourne dans le vide
Vérifie dans Vercel que `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont bien définies pour l'environnement Production.

### Je veux ajouter d'autres utilisateurs
Deux options :
1. **Self-service** : créer dans **Supabase Dashboard → Authentication → Users**, puis ajouter une ligne dans la table `users` (Table Editor) avec `email`, `nom`, `role`, `client_id` et `auth_id` (= l'ID du user Supabase).
2. **Programmatique** : dupliquer le bloc utilisateur dans `prisma/seed.ts` puis relancer `npm run db:seed` (idempotent).

---

## Référence rapide — variables d'environnement

| Nom | Où | Source |
|---|---|---|
| `DATABASE_URL` | local + Vercel | Supabase → Settings → Database (port 6543) |
| `DIRECT_URL` | local + Vercel | Supabase → Settings → Database (port 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | local + Vercel | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | local + Vercel | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | local + Vercel | Supabase → Settings → API (⚠ secret) |
| `NEXT_PUBLIC_APP_URL` | local + Vercel | URL publique de l'app |
| `NEXT_PUBLIC_DEMO_MODE` | local uniquement (optionnel, dev) | `true` pour bypasser l'auth en dev |

---

## Pour mémoire — commandes utiles

```bash
npm run dev          # lancer en local sur http://localhost:3000
npm run build        # build production
npm run db:push      # appliquer le schéma à la base
npm run db:seed      # (re)charger les données de démo
npm run db:studio    # ouvrir Prisma Studio (UI pour la base)
npm run typecheck    # vérifier le typage TypeScript
```
