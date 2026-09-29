# CBS BE BIG — API backend partagée

Cette API remplace le stockage local (IndexedDB) de `longrich-console.html` par
une vraie base de données partagée (Neon/Postgres), accessible depuis n'importe
quel appareil. Elle contient déjà tes 60 produits, 37 photos, 20 membres tontine
et l'équipe commerciale (fichier `db/backup.json`).

## 1. Créer les tables dans Neon

1. Va sur [console.neon.tech](https://console.neon.tech), ouvre ton projet.
2. Menu **SQL Editor** → colle le contenu de `db/schema.sql` → **Run**.
3. Tu dois voir 11 tables créées (products, orders, tontine_members, etc.).

## 2. Tester en local (facultatif mais conseillé)

```bash
npm install
cp .env.example .env
```

Ouvre `.env` et remplace `DATABASE_URL` par ta vraie chaîne de connexion Neon
(celle avec le mot de passe en clair, pas les astérisques), et choisis un
`JWT_SECRET` et un `ADMIN_PASSWORD` à toi.

```bash
npm run migrate     # remplit Neon avec db/backup.json — à faire UNE seule fois
npm start           # démarre l'API sur http://localhost:3000
```

Teste avec :
```bash
curl http://localhost:3000/api/products
curl -X POST http://localhost:3000/api/admin/login -H "Content-Type: application/json" -d '{"password":"longrich2026"}'
```

## 3. Mettre le code sur GitHub

```bash
git init
git add .
git commit -m "API backend CBS BE BIG"
git branch -M main
git remote add origin https://github.com/TON-PSEUDO/cbs-be-big-api.git
git push -u origin main
```
(crée d'abord le dépôt vide `cbs-be-big-api` sur github.com, sans README).

**Important** : `.env` est dans `.gitignore` — il ne partira jamais sur GitHub.
C'est voulu : le vrai mot de passe reste seulement sur ta machine et dans Render.

## 4. Déployer sur Render

1. [render.com](https://render.com) → **New +** → **Web Service**.
2. Connecte le dépôt `cbs-be-big-api`.
3. Render détecte Node.js automatiquement :
   - **Build command** : `npm install`
   - **Start command** : `npm start`
4. Onglet **Environment** → ajoute les 3 variables :
   - `DATABASE_URL` → ta chaîne Neon (avec le vrai mot de passe)
   - `JWT_SECRET` → une longue chaîne aléatoire (ex. générée sur passwordsgenerator.net)
   - `ADMIN_PASSWORD` → le mot de passe admin que tu veux
5. **Create Web Service**. Au premier démarrage, ouvre `db/migrate.js` sur ta
   machine en local avec la vraie `DATABASE_URL` (étape 2) — Render ne lance
   pas la migration tout seul, c'est une opération à faire une fois, à la main.
6. Render te donne une adresse du type `https://cbs-be-big-api.onrender.com`.
   Vérifie : `https://cbs-be-big-api.onrender.com/health` doit répondre `{"ok":true}`.

## Ce qui reste à faire

`longrich-console.html` doit maintenant être modifié pour appeler cette API au
lieu du stockage local — c'est l'étape suivante, séparée de ce dépôt.

## Résumé des routes

| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/products` | public |
| GET | `/api/products/:id/photo` | public |
| POST/PUT/DELETE | `/api/products...` | admin |
| POST | `/api/orders` | public (passer commande) |
| GET | `/api/orders` | admin |
| POST | `/api/users/register`, `/login` | public |
| GET | `/api/commerciaux` | public |
| GET | `/api/tontine/members`, `/draws`, `/versements`, `/state` | public |
| POST | `/api/tontine/demandes` | public (demande d'adhésion) |
| toutes les autres écritures tontine | admin |
| POST | `/api/admin/login` | public (mot de passe admin → jeton) |
