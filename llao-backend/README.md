# Dashboard Dash - Document Intelligence

Ce dashboard permet de visualiser les documents stockés dans la base MongoDB alimentée par l'application principale.

## Installation

1. Placez-vous dans le dossier `dashboard/` :
   ```bash
   cd dashboard
   ```
2. Installez les dépendances :
   ```bash
   pip install -r requirements.txt
   ```

## Lancement du dashboard

1. Assurez-vous que votre fichier `.env` (avec la connexion MongoDB) est bien présent à la racine du projet principal.
2. Lancez le dashboard :
   ```bash
   python app.py
   ```
3. Ouvrez votre navigateur à l'adresse indiquée (par défaut http://127.0.0.1:8050/).

## Personnalisation
- Le code source du dashboard se trouve dans `dashboard/app.py`.
- Vous pouvez ajouter des graphiques, filtres, statistiques, etc. en modifiant ce fichier.

---

**Technos utilisées :**
- [Dash](https://dash.plotly.com/)
- [Pandas](https://pandas.pydata.org/)
- [PyMongo](https://pymongo.readthedocs.io/)
- [python-dotenv](https://pypi.org/project/python-dotenv/) 