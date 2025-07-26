# LLAO Application

Application de gestion et d'analyse d'appels d'offres avec visualisations avancées.

## 🏗️ Architecture

```
llao-application/
├── api/                    # Backend FastAPI
│   ├── server/
│   │   ├── main.py         # Point d'entrée FastAPI
│   │   ├── auth/           # Authentification JWT
│   │   ├── database/       # Connexion MongoDB
│   │   ├── api/            # Routes API
│   │   └── utils/          # Utilitaires
│   └── requirements.txt
├── client/                 # Frontend React/TypeScript
│   ├── src/
│   │   ├── pages/          # Pages organisées par domaine
│   │   ├── components/     # Composants réutilisables
│   │   ├── services/       # Services API
│   │   ├── hooks/          # Hooks personnalisés
│   │   ├── context/        # Contextes React
│   │   ├── types/          # Types TypeScript
│   │   └── utils/          # Utilitaires
│   └── package.json
├── scripts/                # Scripts d'installation/déploiement
├── docs/                   # Documentation
└── README.md
```

## 🚀 Installation rapide

### Windows
```bash
# Installation automatique
scripts/install.bat

# Démarrage automatique
scripts/start.bat
```

### Manuel
```bash
# Backend API
cd api
pip install -r requirements.txt
python -m uvicorn server.main:app --reload

# Frontend Client
cd client
npm install
npm run dev
```

## 📋 Prérequis

- **Python 3.8+**
- **Node.js 16+**
- **MongoDB 4.4+**
- **Git**

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=llao_db

# JWT
JWT_SECRET_KEY=votre_cle_secrete_ici
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# API
API_HOST=0.0.0.0
API_PORT=8000

# Frontend
VITE_API_URL=http://localhost:8000/api
```

## 🎯 Fonctionnalités

### Backend API (FastAPI)
- ✅ **Authentification JWT** avec gestion des rôles
- ✅ **CRUD Appels d'offres** avec filtres avancés
- ✅ **Tableaux de bord personnalisables** avec graphiques
- ✅ **Statistiques avancées** (gagné/perdu, délais, notes, prix)
- ✅ **Export Excel/PDF** des données
- ✅ **Gestion des favoris**
- ✅ **Recherche intelligente**
- ✅ **Documentation automatique** (Swagger/OpenAPI)

### Frontend Client (React/TypeScript)
- ✅ **Interface moderne** avec Tailwind CSS
- ✅ **Tableaux de bord interactifs** avec React Grid Layout
- ✅ **Graphiques avancés** (Nivo, Chart.js, Plotly)
- ✅ **Gestion d'état** avec Context API
- ✅ **Authentification** avec protection des routes
- ✅ **Responsive design** pour tous les écrans
- ✅ **Thème clair/sombre**

## 📊 Types de graphiques disponibles

- **Graphiques en barres** (gagné/perdu, par catégorie, par pôle)
- **Graphiques circulaires** (répartition des statuts)
- **Graphiques linéaires** (évolution temporelle)
- **Nuages de points** (corrélation prix/notes)
- **Box plots** (distribution des notes/prix)
- **Heatmaps** (matrices de données)
- **Graphiques radar** (profil multi-critères)
- **Histogrammes** (répartition par tranches)

## 🔐 Sécurité

- **Authentification JWT** avec expiration automatique
- **Hachage des mots de passe** avec bcrypt
- **Validation des données** avec Pydantic
- **Protection CORS** configurée
- **Gestion des rôles** (user/admin)

## 📈 Statistiques disponibles

### Appels d'offres
- **Taux de succès** global et par catégorie/pôle
- **Évolution temporelle** des performances
- **Analyse des délais** de réponse
- **Comparaison des notes** techniques et prix
- **Positionnement tarifaire** vs concurrents
- **Écarts de score** avec les gagnants

### Tableaux de bord
- **Création personnalisée** de dashboards
- **Filtres globaux** et par graphique
- **Disposition libre** des widgets
- **Sauvegarde automatique** des configurations

## 🛠️ Développement

### Structure des routes API

```
/api
├── /tenders              # Appels d'offres
│   ├── GET /             # Liste avec filtres
│   ├── GET /{id}         # Détails
│   ├── POST /            # Création
│   ├── PATCH /{id}       # Modification
│   ├── DELETE /{id}      # Suppression
│   ├── /stats/*          # Statistiques
│   ├── /favorites/*      # Gestion favoris
│   └── /export/*         # Export données
├── /dashboards           # Tableaux de bord
│   ├── GET /             # Liste utilisateur
│   ├── POST /            # Création
│   ├── PATCH /{id}       # Modification
│   ├── DELETE /{id}      # Suppression
│   └── /{id}/*           # Gestion graphiques
└── /auth                 # Authentification
    ├── POST /register    # Inscription
    ├── POST /token       # Connexion
    └── /users/*          # Gestion utilisateurs
```

### Commandes utiles

```bash
# Backend
cd api
python -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd client
npm run dev
npm run build
npm run preview

# Tests
cd api
python -m pytest

cd client
npm test
```

## 📚 Documentation

- **API Documentation** : http://localhost:8000/docs (Swagger UI)
- **ReDoc** : http://localhost:8000/redoc
- **Health Check** : http://localhost:8000/health

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation API
- Vérifiez les logs de l'application

---

**LLAO Application** - Gestion intelligente des appels d'offres 🎯 