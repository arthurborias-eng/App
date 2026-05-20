# CollabSpots

Hub collaboratif pour partager et noter des lieux, restaurants et activités entre amis.

## Fonctionnalités

- **Authentification** — inscription / connexion par email
- **Ajouter un endroit** — nom, type (restaurant, bar, activité, lieu…), description, photo et position sur la carte
- **Onglet "À explorer"** — liste de tous les endroits proposés par le groupe
- **Onglet "Faites"** — activités réalisées, avec notation ⭐ (1→5) et commentaires
- **Temps réel** — synchronisation instantanée via Firestore

## Stack

| Couche | Technologie |
|---|---|
| Frontend | React + Vite |
| Style | Tailwind CSS v4 |
| Auth | Firebase Authentication |
| Base de données | Cloud Firestore |
| Stockage images | Firebase Storage |
| Carte | OpenStreetMap via React-Leaflet |

## Setup

### 1. Créer un projet Firebase

1. Aller sur [console.firebase.google.com](https://console.firebase.google.com)
2. Créer un nouveau projet
3. Activer **Authentication** → Email/Mot de passe
4. Créer une base **Firestore** (démarrer en mode test)
5. Activer **Storage**
6. Dans "Paramètres du projet" → "Vos applications" → ajouter une app Web → copier la config

### 2. Variables d'environnement

```bash
cp .env.example .env
# Remplir avec ta config Firebase
```

### 3. Règles Firestore

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /activities/{id} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Règles Storage

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /activities/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

### 5. Lancer

```bash
npm install
npm run dev
```

### 6. Déployer

```bash
npm run build
# Déployer dist/ sur Vercel, Netlify ou Firebase Hosting
```
