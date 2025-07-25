import sys
import os
from pathlib import Path

# Pour permettre l'import du client MongoDB existant
sys.path.append(str(Path(__file__).resolve().parent.parent / 'Document-intelligence-azure-2' / 'src'))

from clients.mongodb_client import MongoDBClient
import dash
from dash import html, dcc, dash_table
import pandas as pd
from dotenv import load_dotenv
from dash.dependencies import Input, Output, State
import plotly.express as px
import plotly.graph_objects as go
import numpy as np
import datetime
import calendar

# Palette graphique (voir custom.css pour détails)
COLORS = {
    # Principale
    'bleu_clair': '#4472C4',  # succès, écart faible
    'bleu_fonce': '#002060',  # perdu, écart élevé
    'orange': '#F4B084',      # délai long, trop cher
    'vert': '#00B050',        # aligné, KPIs positifs
    'rouge': '#FF0000',       # alertes critiques
    # Thème clair (tons verts)
    'fond_principal': '#F0FFF4',
    'fond_secondaire': '#E8F5E9',
    'texte_principal': '#1A1A1A',
    'texte_secondaire': '#4A635D',
    'lien': '#37966F',
    'bordure': '#D0E8DA',
    'hover': '#B2DFDB',
    'erreur': '#D32F2F',
    'bouton_principal': '#37966F',
    'bouton_secondaire': '#A5D6A7',
    # Thème sombre (tons verts)
    'dark_fond': '#1E2B26',
    'dark_card': '#2E3D37',
    'dark_texte': '#E8F5E9',
    'dark_texte_secondaire': '#B2BEB5',
    'dark_lien': '#80CBC4',
    'dark_bordure': '#486B5F',
    'dark_hover': '#4DB6AC',
    'dark_bouton': '#66BB6A',
    'dark_bouton_secondaire': '#A5D6A7',
    'dark_erreur': '#EF5350',
}

# Couleurs pour graphiques (exemple)
# Gagné: #00B050, Perdu: #002060, In progress: #F4B084, Alerte: #FF0000
# Écart faible: #4472C4, Écart élevé: #002060
# Délais: 0-7j: #C6EFCE, 8-15j: #FFE699, 15+j: #F4B084
# Multi-catégories: #4472C4, #70AD47, #ED7D31, #A5A5A5, #FFC000, #5B9BD5, #C00000

# Charger les variables d'environnement
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / 'Document-intelligence-azure-2' / '.env', override=True)

# Initialiser le client MongoDB
mongo_client = MongoDBClient()

def get_documents_df(limit=1000):
    docs = mongo_client.get_all_documents(limit=limit)
    for doc in docs:
        doc['_id'] = str(doc['_id'])
    return pd.DataFrame(docs)

df = get_documents_df()

# Valeurs uniques pour les filtres (placeholder si vide)
def get_unique(df, col):
    return sorted([v for v in df[col].dropna().unique() if v != '']) if col in df.columns else []

# Données fictives pour les graphiques (doivent être définies AVANT app.layout)
kpi_data = {'total': 80, 'gagne': 42, 'perdu': 28, 'in_progress': 10}
pie_gagne_perdu_data = pd.DataFrame({
    'Statut': ['Gagné', 'Perdu', 'In progress'],
    'Nombre': [42, 28, 10]
})
fig_pie_gagne_perdu = px.pie(pie_gagne_perdu_data, names='Statut', values='Nombre', color='Statut',
    color_discrete_map={'Gagné': '#00B050', 'Perdu': '#D32F2F', 'In progress': '#F4B084'})
fig_pie_gagne_perdu.update_traces(textinfo='percent+label')

hist_categorie_data = pd.DataFrame({
    'Catégorie': ['Bâtiment', 'Informatique', 'Services', 'Transport'],
    'Gagné': [10, 8, 12, 12],
    'Perdu': [5, 7, 9, 7],
    'In progress': [2, 1, 3, 4]
})
df_long_cat = hist_categorie_data.melt(id_vars='Catégorie', var_name='Statut', value_name='Nombre')
fig_hist_categorie = px.bar(df_long_cat, x='Catégorie', y='Nombre', color='Statut', barmode='group',
    color_discrete_map={'Gagné': '#00B050', 'Perdu': '#D32F2F', 'In progress': '#F4B084'})

hist_pole_data = pd.DataFrame({
    'Pôle': ['Pôle A', 'Pôle B', 'Pôle C'],
    'Gagné': [15, 12, 15],
    'Perdu': [8, 10, 10]
})
df_long_pole = hist_pole_data.melt(id_vars='Pôle', var_name='Statut', value_name='Nombre')
fig_hist_pole = px.bar(df_long_pole, x='Pôle', y='Nombre', color='Statut', barmode='group',
    color_discrete_map={'Gagné': '#00B050', 'Perdu': '#D32F2F'})

delai_categorie_data = pd.DataFrame({
    'Catégorie': ['Bâtiment', 'Informatique', 'Services', 'Transport'],
    'Délai moyen (jours)': [8, 12, 6, 15]
})
fig_delai_categorie = px.bar(delai_categorie_data, x='Catégorie', y='Délai moyen (jours)', color='Catégorie',
    color_discrete_sequence=['#4472C4', '#70AD47', '#ED7D31', '#A5A5A5'])

delai_ao_data = pd.DataFrame({
    'AO': [f'AO {i}' for i in range(1, 11)],
    'Délai (jours)': np.random.randint(3, 20, 10)
})
fig_delai_ao = px.bar(delai_ao_data, x='AO', y='Délai (jours)', color='Délai (jours)',
    color_continuous_scale=['#C6EFCE', '#FFE699', '#F4B084'])

scatter_data = pd.DataFrame({
    'Prix': np.random.randint(10000, 50000, 30),
    'Note technique': np.random.uniform(10, 20, 30),
    'AO': [f'AO {i}' for i in range(1, 31)]
})
fig_scatter = px.scatter(
    scatter_data, x='Prix', y='Note technique', text='AO', color='Note technique',
    color_continuous_scale=['#4472C4', '#00B050'],
    trendline='ols',
    height=600
)
fig_scatter.update_traces(marker=dict(size=14, line=dict(width=2, color='#E8F5E9')))

notes_tech_prix_data = pd.DataFrame({
    'Catégorie': ['Bâtiment', 'Informatique', 'Services', 'Transport'],
    'Note technique': [12.5, 14.2, 13.8, 15.1],
    'Note prix': [13.1, 12.8, 14.0, 13.5]
})
fig_notes_tech_prix = go.Figure()
fig_notes_tech_prix.add_trace(go.Bar(x=notes_tech_prix_data['Catégorie'], y=notes_tech_prix_data['Note technique'], name='Note technique', marker_color='#00B050'))
fig_notes_tech_prix.add_trace(go.Bar(x=notes_tech_prix_data['Catégorie'], y=notes_tech_prix_data['Note prix'], name='Note prix', marker_color='#4472C4'))
fig_notes_tech_prix.update_layout(barmode='group')

notes_qualitatives_data = pd.DataFrame({
    'Catégorie': ['Bâtiment', 'Informatique', 'Services', 'Transport'],
    'Création': [13, 14, 12, 15],
    'Équipe': [12, 13, 14, 13],
    'Planification': [14, 12, 13, 15],
    'RSE': [13, 15, 14, 12]
})
fig_notes_qualitatives = go.Figure()
for col, color in zip(['Création', 'Équipe', 'Planification', 'RSE'], ['#70AD47', '#ED7D31', '#FFC000', '#5B9BD5']):
    fig_notes_qualitatives.add_trace(go.Bar(x=notes_qualitatives_data['Catégorie'], y=notes_qualitatives_data[col], name=col, marker_color=color))
fig_notes_qualitatives.update_layout(barmode='group')

ecart_score_data = pd.DataFrame({
    'AO': [f'AO {i}' for i in range(1, 11)],
    'Catégorie': np.random.choice(['Bâtiment', 'Informatique', 'Services', 'Transport'], 10),
    'Score gagnant': np.random.uniform(80, 100, 10),
    'Score client': np.random.uniform(60, 95, 10)
})
fig_ecart_score = go.Figure()
fig_ecart_score.add_trace(go.Bar(x=ecart_score_data['AO'], y=ecart_score_data['Score gagnant']-ecart_score_data['Score client'], name='Écart', marker_color='#4472C4'))

prix_ecart_data = pd.DataFrame({
    'AO': [f'AO {i}' for i in range(1, 11)],
    'Prix client': np.random.randint(20000, 50000, 10),
    'Prix gagnant': np.random.randint(20000, 50000, 10)
})
fig_prix_ecart = go.Figure()
fig_prix_ecart.add_trace(go.Bar(x=prix_ecart_data['AO'], y=prix_ecart_data['Prix client']-prix_ecart_data['Prix gagnant'], name='Écart de prix', marker_color='#F4B084'))

positionnement_prix_data = pd.DataFrame({
    'Positionnement': ['Trop cher', 'Trop bas', 'Aligné'],
    'Nombre': [12, 8, 20]
})
fig_positionnement_prix = px.bar(positionnement_prix_data, x='Positionnement', y='Nombre', color='Positionnement',
    color_discrete_map={'Trop cher': '#F4B084', 'Trop bas': '#002060', 'Aligné': '#00B050'})

# Données fictives pour le tableau AO délais
np.random.seed(42)
delai_table_data = pd.DataFrame({
    'Nom AO': [f'AO {i}' for i in range(1, 21)],
    'Catégorie': np.random.choice(['Bâtiment', 'Informatique', 'Services', 'Transport'], 20),
    'Date émission': [datetime.date(2024, 1, 1) + datetime.timedelta(days=int(x)) for x in np.random.randint(0, 120, 20)],
    'Date réponse': [datetime.date(2024, 1, 1) + datetime.timedelta(days=int(x)) for x in np.random.randint(10, 150, 20)],
    'Statut': np.random.choice(['Gagné', 'Perdu', 'In progress'], 20),
    'Pôle': np.random.choice(['Pôle A', 'Pôle B', 'Pôle C'], 20)
})
delai_table_data['Délai (jours)'] = (delai_table_data['Date réponse'] - delai_table_data['Date émission']).apply(lambda x: x.days)

# Histogramme par tranche de délai
bins = [0, 7, 15, 100]
labels = ['0-7 jours', '8-15 jours', '16+ jours']
delai_table_data['Tranche délai'] = pd.cut(delai_table_data['Délai (jours)'], bins=bins, labels=labels, right=True, include_lowest=True)
delai_tranche_data = delai_table_data.groupby('Tranche délai').size().reset_index(name='Nombre AO')
fig_hist_tranche = px.bar(delai_tranche_data, x='Tranche délai', y='Nombre AO', color='Tranche délai',
    color_discrete_map={'0-7 jours': '#00B050', '8-15 jours': '#FFE699', '16+ jours': '#F4B084'})

# Top 5 AO délais les plus longs
top5_delai = delai_table_data.nlargest(5, 'Délai (jours)')
fig_top5_delai = px.bar(top5_delai, x='Délai (jours)', y='Nom AO', orientation='h', color='Délai (jours)',
    color_continuous_scale=['#00B050', '#FFE699', '#F4B084', '#D32F2F'])

# Données fictives pour le tableau AO notes
notes_table_data = pd.DataFrame({
    'Nom AO': [f'AO {i}' for i in range(1, 21)],
    'Catégorie': np.random.choice(['Bâtiment', 'Informatique', 'Services', 'Transport'], 20),
    'Note technique': np.random.uniform(8, 20, 20).round(2),
    'Note prix': np.random.uniform(8, 20, 20).round(2),
    'Création': np.random.uniform(8, 20, 20).round(2),
    'Équipe': np.random.uniform(8, 20, 20).round(2),
    'Planification': np.random.uniform(8, 20, 20).round(2),
    'RSE': np.random.uniform(8, 20, 20).round(2),
    'Statut': np.random.choice(['Gagné', 'Perdu', 'In progress'], 20),
    'Pôle': np.random.choice(['Pôle A', 'Pôle B', 'Pôle C'], 20)
})

# Boxplot des notes techniques par catégorie
fig_box_tech = px.box(notes_table_data, x='Catégorie', y='Note technique', color='Catégorie',
    color_discrete_sequence=['#4472C4', '#70AD47', '#ED7D31', '#A5A5A5'])

# Histogramme des AO par tranche de note technique
bins_note = [0, 10, 12, 14, 16, 20]
labels_note = ['<10', '10-12', '12-14', '14-16', '16+']
notes_table_data['Tranche note technique'] = pd.cut(notes_table_data['Note technique'], bins=bins_note, labels=labels_note, right=True, include_lowest=True)
note_tranche_data = notes_table_data.groupby('Tranche note technique').size().reset_index(name='Nombre AO')
fig_hist_note_tranche = px.bar(note_tranche_data, x='Tranche note technique', y='Nombre AO', color='Tranche note technique',
    color_discrete_map={'<10': '#D32F2F', '10-12': '#F4B084', '12-14': '#FFE699', '14-16': '#70AD47', '16+': '#00B050'})

# Top 5 AO meilleure note technique
top5_note_tech = notes_table_data.nlargest(5, 'Note technique')
fig_top5_note_tech = px.bar(top5_note_tech, x='Note technique', y='Nom AO', orientation='h', color='Note technique',
    color_continuous_scale=['#FFE699', '#70AD47', '#00B050'])

# Radar chart comparatif des moyennes par catégorie
radar_data = notes_table_data.groupby('Catégorie')[['Note technique', 'Note prix', 'Création', 'Équipe', 'Planification', 'RSE']].mean().reset_index()
fig_radar = go.Figure()
for i, row in radar_data.iterrows():
    fig_radar.add_trace(go.Scatterpolar(
        r=[row['Note technique'], row['Note prix'], row['Création'], row['Équipe'], row['Planification'], row['RSE'], row['Note technique']],
        theta=['Technique', 'Prix', 'Création', 'Équipe', 'Planification', 'RSE', 'Technique'],
        fill='toself',
        name=row['Catégorie'],
        line=dict(width=2)
    ))
fig_radar.update_layout(
    polar=dict(radialaxis=dict(visible=True, range=[8, 20])),
    showlegend=True,
    margin=dict(l=40, r=40, t=40, b=40)
)

# Génération de données mensuelles fictives pour AO
mois = [calendar.month_abbr[m] for m in range(1, 13)]
np.random.seed(42)
mois_data = pd.DataFrame({
    'Mois': mois,
    'Gagné': np.random.randint(2, 8, 12),
    'Perdu': np.random.randint(1, 6, 12),
    'In progress': np.random.randint(0, 3, 12)
})
mois_data['Total'] = mois_data['Gagné'] + mois_data['Perdu'] + mois_data['In progress']
mois_data['Taux de succès'] = (mois_data['Gagné'] / mois_data['Total']).round(2)

# Courbe d'évolution du taux de succès par mois
fig_taux_succes_mois = go.Figure()
fig_taux_succes_mois.add_trace(go.Scatter(x=mois_data['Mois'], y=mois_data['Taux de succès'], mode='lines+markers', name='Taux de succès', line=dict(color='#00B050', width=3)))
fig_taux_succes_mois.update_layout(yaxis_tickformat='.0%', yaxis_range=[0,1], title='Taux de succès par mois')

# Heatmap Catégorie x Statut
heatmap_data = notes_table_data.groupby(['Catégorie', 'Statut']).size().unstack(fill_value=0)
fig_heatmap_cat_statut = go.Figure(data=go.Heatmap(
    z=heatmap_data.values,
    x=heatmap_data.columns,
    y=heatmap_data.index,
    colorscale='Greens',
    colorbar=dict(title='Nombre AO')
))
fig_heatmap_cat_statut.update_layout(title='Répartition Catégorie x Statut')

# Barplot taux de succès par pôle
pole_data = notes_table_data.groupby(['Pôle', 'Statut']).size().unstack(fill_value=0)
pole_data['Taux de succès'] = pole_data['Gagné'] / pole_data.sum(axis=1)
fig_taux_succes_pole = px.bar(pole_data.reset_index(), x='Pôle', y='Taux de succès', color='Pôle',
    color_discrete_sequence=['#4472C4', '#70AD47', '#ED7D31'])
fig_taux_succes_pole.update_layout(yaxis_tickformat='.0%', title='Taux de succès par pôle')

# Histogramme du nombre d'AO par mois (fictif)
fig_hist_ao_mois = px.bar(mois_data, x='Mois', y='Total', color='Total', color_continuous_scale=['#B2DFDB', '#37966F'])
fig_hist_ao_mois.update_layout(title="Nombre d'AO par mois")

# Ajoute le barplot taux de succès par catégorie
cat_data = notes_table_data.groupby(['Catégorie', 'Statut']).size().unstack(fill_value=0)
cat_data['Taux de succès'] = cat_data['Gagné'] / cat_data.sum(axis=1)
fig_taux_succes_cat = px.bar(cat_data.reset_index(), x='Catégorie', y='Taux de succès', color='Catégorie',
    color_discrete_sequence=['#4472C4', '#70AD47', '#ED7D31', '#A5A5A5'])
fig_taux_succes_cat.update_layout(yaxis_tickformat='.0%', title='Taux de succès par catégorie')

# Ajoute boxplot des prix par catégorie
fig_box_prix_cat = px.box(notes_table_data, x='Catégorie', y='Note prix', color='Catégorie',
    color_discrete_sequence=['#4472C4', '#70AD47', '#ED7D31', '#A5A5A5'])
fig_box_prix_cat.update_layout(title='Boxplot des prix par catégorie')

# Ajoute histogramme du nombre d'AO par tranche de prix
bins_prix = [8, 12, 14, 16, 20]
labels_prix = ['8-12', '12-14', '14-16', '16-20']
notes_table_data['Tranche prix'] = pd.cut(notes_table_data['Note prix'], bins=bins_prix, labels=labels_prix, right=True, include_lowest=True)
prix_tranche_data = notes_table_data.groupby('Tranche prix').size().reset_index(name='Nombre AO')
fig_hist_ao_tranche_prix = px.bar(prix_tranche_data, x='Tranche prix', y='Nombre AO', color='Tranche prix',
    color_discrete_map={'8-12': '#F4B084', '12-14': '#FFE699', '14-16': '#70AD47', '16-20': '#00B050'})
fig_hist_ao_tranche_prix.update_layout(title="Nombre d'AO par tranche de prix")

# Ajoute taux de succès par tranche de prix
prix_succes = notes_table_data.groupby(['Tranche prix', 'Statut']).size().unstack(fill_value=0)
prix_succes['Taux de succès'] = prix_succes['Gagné'] / prix_succes.sum(axis=1)
fig_taux_succes_tranche_prix = px.bar(prix_succes.reset_index(), x='Tranche prix', y='Taux de succès', color='Tranche prix',
    color_discrete_map={'8-12': '#F4B084', '12-14': '#FFE699', '14-16': '#70AD47', '16-20': '#00B050'})
fig_taux_succes_tranche_prix.update_layout(yaxis_tickformat='.0%', title='Taux de succès par tranche de prix')

# Ajoute une colonne 'Prix' fictive pour la démo si elle n'existe pas déjà
if 'Prix' not in notes_table_data.columns:
    notes_table_data['Prix'] = np.random.randint(10000, 50000, len(notes_table_data))
# Ajoute la colonne 'Tranche de prix' (déjà calculée plus haut sous 'Tranche prix')
notes_table_data['Tranche de prix'] = notes_table_data['Tranche prix']
# Colonnes du tableau détaillé
prix_table_cols = ['Nom AO', 'Catégorie', 'Prix', 'Tranche de prix', 'Note prix', 'Statut', 'Pôle']

# Boxplot de l'écart de score par catégorie
ecart_score_data['Ecart'] = (ecart_score_data['Score gagnant'] - ecart_score_data['Score client']).round(2)
fig_box_ecart_cat = px.box(ecart_score_data, x='Catégorie', y='Ecart', color='Catégorie',
    color_discrete_sequence=['#4472C4', '#70AD47', '#ED7D31', '#A5A5A5'])
fig_box_ecart_cat.update_layout(title="Boxplot de l'écart de score par catégorie")

# Correction bins/labels pour tranches d'écart
bins_ecart = [0, 5, 10, 20, 40, float('inf')]
labels_ecart = ['<5', '5-10', '10-20', '20-40', '40+']
ecarts = ecart_score_data['Ecart'].clip(lower=0)
ecarts_tranche = pd.cut(ecarts, bins=bins_ecart, labels=labels_ecart, right=False, include_lowest=True)
hist_ecart_data = ecart_score_data.copy()
hist_ecart_data['Tranche écart'] = ecarts_tranche
hist_ecart_count = hist_ecart_data.groupby('Tranche écart').size().reset_index(name='Nombre AO')
fig_hist_ecart = px.bar(hist_ecart_count, x='Tranche écart', y='Nombre AO', color='Tranche écart',
    color_discrete_map={'<5': '#70AD47', '5-10': '#FFE699', '10-20': '#F4B084', '20-40': '#D32F2F', '40+': '#4472C4'})
fig_hist_ecart.update_layout(title="Nombre d'AO par tranche d'écart de score")

# Top 5 AO écart le plus faible
top5_faible = ecart_score_data.nsmallest(5, 'Ecart')
fig_top5_faible = px.bar(top5_faible, x='Ecart', y='AO', orientation='h', color='Ecart', color_continuous_scale=['#70AD47', '#FFE699'])
fig_top5_faible.update_layout(title="Top 5 AO écart le plus faible")
# Top 5 AO écart le plus élevé
top5_fort = ecart_score_data.nlargest(5, 'Ecart')
fig_top5_fort = px.bar(top5_fort, x='Ecart', y='AO', orientation='h', color='Ecart', color_continuous_scale=['#FFE699', '#D32F2F'])
fig_top5_fort.update_layout(title="Top 5 AO écart le plus élevé")

# Scatter Score gagnant vs Score client
fig_scatter_score = px.scatter(ecart_score_data, x='Score gagnant', y='Score client', color='Catégorie', text='AO',
    color_discrete_sequence=['#4472C4', '#70AD47', '#ED7D31', '#A5A5A5'])
fig_scatter_score.update_traces(marker=dict(size=14, line=dict(width=2, color='#E8F5E9')))
fig_scatter_score.update_layout(title="Score gagnant vs Score client")

# Tableau détaillé
ecart_table_cols = ['AO', 'Catégorie', 'Score gagnant', 'Score client', 'Ecart']

# Sidebar modernisée
sidebar_default_values = {
    'categorie': get_unique(notes_table_data, 'Catégorie'),
    'pole': get_unique(notes_table_data, 'Pôle'),
    'statut': get_unique(notes_table_data, 'Statut'),
    'nom_ao': get_unique(notes_table_data, 'Nom AO'),
}

sidebar = html.Div([
    html.Div([
        html.Button('☰ Filtres', id='open-sidebar', n_clicks=0, className='btn-primary', style={'marginBottom': 18, 'display': 'none'}),
        html.H2('Filtres', style={'color': "#1A1A1A", 'fontFamily': 'General Sans, Segoe UI, sans-serif', 'fontSize': 22, 'marginBottom': 8}),
        html.Hr(style={'margin': '8px 0 18px 0', 'borderColor': COLORS['bordure']}),
        html.Div([
            html.Label('Catégorie', htmlFor='filter-categorie', style={'fontWeight': 500, 'marginBottom': 2}),
            dcc.Dropdown(
                id='filter-categorie',
                options=[{'label': v, 'value': v} for v in sidebar_default_values['categorie']],
                multi=True,
                placeholder='Catégorie',
                value=sidebar_default_values['categorie'],
                className='dash-dropdown',
                style={'marginBottom': 18},
            ),
            html.Label('Pôle', htmlFor='filter-pole', style={'fontWeight': 500, 'marginBottom': 2}),
            dcc.Dropdown(
                id='filter-pole',
                options=[{'label': v, 'value': v} for v in sidebar_default_values['pole']],
                multi=True,
                placeholder='Pôle',
                value=sidebar_default_values['pole'],
                className='dash-dropdown',
                style={'marginBottom': 18},
            ),
            html.Label('Statut', htmlFor='filter-statut', style={'fontWeight': 500, 'marginBottom': 2}),
            dcc.Dropdown(
                id='filter-statut',
                options=[{'label': v, 'value': v} for v in sidebar_default_values['statut']],
                multi=True,
                placeholder='Statut',
                value=sidebar_default_values['statut'],
                className='dash-dropdown',
                style={'marginBottom': 18},
            ),
            html.Label('Nom AO', htmlFor='filter-nom-ao', style={'fontWeight': 500, 'marginBottom': 2}),
            dcc.Dropdown(
                id='filter-nom-ao',
                options=[{'label': v, 'value': v} for v in sidebar_default_values['nom_ao']],
                multi=True,
                placeholder="Nom AO",
                value=sidebar_default_values['nom_ao'],
                className='dash-dropdown',
                style={'marginBottom': 18},
            ),
            html.Label('Période (date de réponse)', htmlFor='filter-date', style={'fontWeight': 500, 'marginBottom': 2}),
            dcc.DatePickerRange(
                id='filter-date',
                start_date=df['Date de réponse'].min() if 'Date de réponse' in df.columns else None,
                end_date=df['Date de réponse'].max() if 'Date de réponse' in df.columns else None,
                display_format='DD/MM/YYYY',
                style={'marginBottom': 18, 'width': '100%'},
            ),
        ], style={'marginBottom': 18}),
        html.Button('Réinitialiser les filtres', id='reset-filters', n_clicks=0, className='btn-secondary', style={'width': '100%', 'marginTop': 12, 'fontWeight': 600}),
    ]),
], className='sidebar sidebar-modern', style={'padding': 18, 'width': 240, 'minHeight': '100vh', 'position': 'fixed', 'top': 56, 'left': 0, 'background': COLORS['fond_secondaire'], 'borderRadius': '0 16px 16px 0', 'boxShadow': '2px 0 16px rgba(55,150,111,0.08)', 'zIndex': 1002, 'overflowY': 'auto', 'maxHeight': '100vh'})

# Layout Dash
app = dash.Dash(__name__, assets_folder='assets')
app.title = 'Dashboard AO'

def help_icon(id, text):
    return html.Span('?', title=text, className='btn-help', style={'marginLeft': '8px', 'cursor': 'pointer', 'display': 'inline-block'})

def help_eye(id, text):
    return html.Span('👁️', title=text, className='btn-eye', style={'marginLeft': '8px', 'cursor': 'pointer', 'display': 'inline-block', 'fontSize': '15px', 'verticalAlign': 'middle'})

app.layout = html.Div([
    dcc.Store(id='theme-store', data={'theme': 'light'}),
    html.Div([
        html.Button(
            id='theme-toggle',
            n_clicks=0,
            children='🌙',
            className='btn-help',
            style={'marginRight': '16px', 'marginTop': '8px', 'fontSize': '20px', 'fontWeight': 'bold', 'background': COLORS['bouton_principal'], 'color': '#fff', 'verticalAlign': 'middle'}
        ),
        html.Div("LL'AO", style={
            'fontFamily': 'General Sans, Segoe UI, sans-serif',
            'color': '#37966F',
            'fontSize': 32,
            'fontWeight': 700,
            'letterSpacing': '2px',
            'marginLeft': 24,
            'display': 'inline-block',
            'verticalAlign': 'middle',
        }),
    ], style={'position': 'fixed', 'top': 0, 'left': 0, 'zIndex': 1001, 'background': 'transparent', 'display': 'flex', 'alignItems': 'center', 'height': 56}),
    sidebar,
    html.Div([
        dcc.Tabs([
            dcc.Tab(label='Analyse Gagné/Perdu', children=[
                html.H1([
                    'KPIs AO / Gagné / Perdu', help_icon('kpi-cards', "Vue d'ensemble des performances globales"), help_eye('eye-kpi-cards', "Chaque part représente la proportion d'AO gagnés, perdus ou en cours. Plus la part verte est grande, plus le taux de succès est élevé.")
                ]),
                html.Div([
                    html.Div(f"Total AO : {kpi_data['total']}", className='kpi-card', style={'background': '#37966F', 'color': '#fff'}),
                    html.Div(f"Gagné : {kpi_data['gagne']}", className='kpi-card', style={'background': '#00B050', 'color': '#fff'}),
                    html.Div(f"Perdu : {kpi_data['perdu']}", className='kpi-card', style={'background': '#D32F2F', 'color': '#fff'}),
                    html.Div(f"In progress : {kpi_data['in_progress']}", className='kpi-card', style={'background': '#F4B084', 'color': '#fff'}),
                ], className='dashboard-kpi-row'),
                html.Div([
                    html.Div([
                        html.H2(['Camembert Gagné / Perdu', help_icon('pie-gagne-perdu', "Donne une vision rapide du taux de succès"), help_eye('eye-pie-gagne-perdu', "Chaque part représente la proportion d'AO gagnés, perdus ou en cours. Plus la part verte est grande, plus le taux de succès est élevé.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_pie_gagne_perdu, config={'toImageButtonOptions': {'filename': 'camembert_gagne_perdu'}}),
                    ], className='dashboard-card'),
                    html.Div([
                        html.H2(["Évolution du taux de succès par mois", help_icon('line-taux-succes-mois', "Suivi du taux de succès (Gagné/Total) par mois"), help_eye('eye-line-taux-succes-mois', "La courbe montre l'évolution du taux de succès (AO gagnés / AO total) mois par mois. Une tendance haussière est positive.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_taux_succes_mois, config={'toImageButtonOptions': {'filename': 'taux_succes_par_mois'}}),
                    ], className='dashboard-card'),
                ], className='dashboard-grid'),
                html.Div([
                    html.Div([
                        html.H2(['Histogramme par Catégorie', help_icon('hist-categorie', "Identifie dans quelles catégories les pertes sont concentrées"), help_eye('eye-hist-categorie', "Chaque barre indique le nombre d'AO par catégorie et par statut. Comparez les performances entre catégories.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_hist_categorie, config={'toImageButtonOptions': {'filename': 'histogramme_categorie'}}),
                    ], className='dashboard-card'),
                    html.Div([
                        html.H2(["Taux de succès par catégorie", help_icon('bar-taux-succes-cat', "Part des AO gagnés par catégorie"), help_eye('eye-bar-taux-succes-cat', "Pour chaque catégorie, la hauteur de la barre indique la part d'AO gagnés. Plus la barre est haute, meilleur est le taux de succès.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_taux_succes_cat, config={'toImageButtonOptions': {'filename': 'taux_succes_par_categorie'}}),
                    ], className='dashboard-card'),
                ], className='dashboard-grid'),
                html.Div([
                    html.Div([
                        html.H2(['Histogramme par Pôle', help_icon('hist-pole', "Visualise les performances par département interne"), help_eye('eye-hist-pole', "Chaque barre indique le nombre d'AO par pôle et par statut. Permet de comparer les pôles entre eux.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_hist_pole, config={'toImageButtonOptions': {'filename': 'histogramme_pole'}}),
                    ], className='dashboard-card'),
                    html.Div([
                        html.H2(["Taux de succès par pôle", help_icon('bar-taux-succes-pole', "Part des AO gagnés par pôle"), help_eye('eye-bar-taux-succes-pole', "Pour chaque pôle, la hauteur de la barre indique la part d'AO gagnés.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_taux_succes_pole, config={'toImageButtonOptions': {'filename': 'taux_succes_par_pole'}}),
                    ], className='dashboard-card'),
                ], className='dashboard-grid'),
                html.Div([
                    html.Div([
                        html.H2(["Nombre d'AO par mois", help_icon('hist-ao-mois', "Volume d'AO traités chaque mois"), help_eye('eye-hist-ao-mois', "Montre le volume d'AO traités chaque mois. Permet d'identifier les pics d'activité.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_hist_ao_mois, config={'toImageButtonOptions': {'filename': 'nombre_ao_par_mois'}}),
                    ], className='dashboard-card'),
                    html.Div([
                        html.H2(["Heatmap Catégorie x Statut", help_icon('heatmap-cat-statut', "Répartition croisée des AO par catégorie et statut"), help_eye('eye-heatmap-cat-statut', "Chaque case indique le nombre d'AO pour une catégorie et un statut donné. Plus la couleur est foncée, plus il y a d'AO.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_heatmap_cat_statut, config={'toImageButtonOptions': {'filename': 'heatmap_categorie_statut'}}),
                    ], className='dashboard-card'),
                ], className='dashboard-grid'),
            ]),
            dcc.Tab(label='Analyse des Délais', children=[
                html.Div([
                    html.Div([
                        html.H2(['Histogramme des délais par Catégorie', help_icon('hist-delai-categorie', "Mesure la réactivité par typologie d'AO"), help_eye('eye-hist-delai-categorie', "Chaque barre indique le nombre d'AO par catégorie et par statut. Permet de comparer les performances entre catégories.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(
                            figure=fig_delai_categorie,
                            config={'toImageButtonOptions': {'filename': 'histogramme_delai_categorie'}}
                        ),
                    ], className='dashboard-card'),
                    html.Div([
                        html.H2(['Barres Délai émission-réponse par AO', help_icon('bar-delai-ao', "Identifie les AO aux temps de réponse longs"), help_eye('eye-bar-delai-ao', "Chaque barre indique le nombre d'AO par AO et par statut. Permet d'identifier les AO aux temps de réponse longs.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(
                            figure=fig_delai_ao,
                            config={'toImageButtonOptions': {'filename': 'barres_delai_ao'}}
                        ),
                    ], className='dashboard-card'),
                ], className='dashboard-grid'),
                html.Div([
                    html.Div([
                        html.H2(['Histogramme par tranche de délai', help_icon('hist-tranche-delai', "Répartition des AO selon la rapidité de réponse"), help_eye('eye-hist-tranche-delai', "Chaque barre indique le nombre d'AO par tranche de délai.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(
                            figure=fig_hist_tranche,
                            config={'toImageButtonOptions': {'filename': 'histogramme_tranche_delai'}}
                        ),
                    ], className='dashboard-card'),
                    html.Div([
                        html.H2(['Top 5 délais les plus longs', help_icon('top5-delai', "Les AO avec les délais de réponse les plus longs"), help_eye('eye-top5-delai', "Chaque barre indique le nombre d'AO par AO et par statut. Permet d'identifier les AO aux temps de réponse longs.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(
                            figure=fig_top5_delai,
                            config={'toImageButtonOptions': {'filename': 'top5_delai'}}
                        ),
                    ], className='dashboard-card'),
                ], className='dashboard-grid'),
                html.Div([
                    html.H2(['Tableau détaillé des AO et délais', help_icon('table-delai', "Liste détaillée des AO, délais, statuts, pôles..."), help_eye('eye-table-delai', "Chaque case indique le nombre d'AO pour une catégorie, un statut, un délai donnés.")], style={'display': 'flex', 'alignItems': 'center'}),
                    dash_table.DataTable(
                        columns=[{"name": i, "id": i} for i in delai_table_data.columns],
                        data=delai_table_data.to_dict('records'),
                        style_table={'overflowX': 'auto'},
                        style_cell={'textAlign': 'left', 'fontFamily': 'IBM Plex Sans', 'fontSize': 14, 'padding': '6px'},
                        style_header={'backgroundColor': '#E8F5E9', 'fontWeight': 'bold'},
                        page_size=10,
                    ),
                ], className='dashboard-card', style={'marginTop': '32px'}),
            ]),
            dcc.Tab(label='Analyse des Notes', children=[
                html.Div([
                    html.Div([
                        html.H2(['Nuage de points Prix vs Note technique', help_icon('scatter-prix-note', "Analyse le rapport qualité-prix des offres"), help_eye('eye-scatter-prix-note', "Chaque point indique le prix et la note technique d'un AO.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(
                            figure=fig_scatter,
                            style={'height': '700px'},
                            config={'toImageButtonOptions': {'filename': 'nuage_prix_vs_note_technique'}}
                        ),
                    ], className='dashboard-card', style={'gridColumn': '1 / -1'}),
                ], className='dashboard-grid', style={'gridTemplateColumns': '1fr'}),
                html.Div([
                    html.Div([
                        html.H2(['Moyenne des Notes techniques vs Moyenne des Notes prix par Catégorie (AO perdus)', help_icon('bar-notes-technique-prix', "Identifier le positionnement de notre client sur le plan technique et prix, par rapport aux standards du marché sur les AO perdus. Cela met en évidence si le client perd sur le prix, sur la technique, ou les deux."), help_eye('eye-bar-notes-technique-prix', "Chaque barre indique la moyenne des notes techniques et prix pour chaque catégorie.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(
                            figure=fig_notes_tech_prix,
                            config={'toImageButtonOptions': {'filename': 'notes_technique_vs_prix'}}
                        ),
                    ], className='dashboard-card'),
                    html.Div([
                        html.H2(['Moyenne des Notes Création, Équipe, Planification et RSE par Catégorie (AO perdus)', help_icon('bar-notes-qualitatives', "Mesurer la performance relative sur ces critères qualitatifs dans les AO perdus, pour comprendre sur quels aspects non-prix le client perd le plus souvent, ce qui permet d'orienter les futurs efforts d'amélioration."), help_eye('eye-bar-notes-qualitatives', "Chaque barre indique la moyenne des notes qualitatives pour chaque catégorie.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(
                            figure=fig_notes_qualitatives,
                            config={'toImageButtonOptions': {'filename': 'notes_qualitatives_par_categorie'}}
                        ),
                    ], className='dashboard-card'),
                ], className='dashboard-grid'),
                html.Div([
                    html.Div([
                        html.H2(['Boxplot des notes techniques par catégorie', help_icon('box-notes-tech', "Dispersion des notes techniques pour chaque catégorie"), help_eye('eye-box-notes-tech', "Chaque barre indique la dispersion des notes techniques pour chaque catégorie.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(
                            id='fig-box-tech',
                            config={'toImageButtonOptions': {'filename': 'boxplot_notes_techniques'}}
                        ),
                    ], className='dashboard-card'),
                    html.Div([
                        html.H2(['Histogramme par tranche de note technique', help_icon('hist-note-tranche', "Répartition des AO selon la qualité technique"), help_eye('eye-hist-note-tranche', "Chaque barre indique le nombre d'AO par tranche de note technique.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(
                            id='fig-hist-note-tranche',
                            config={'toImageButtonOptions': {'filename': 'histogramme_tranche_note_technique'}}
                        ),
                    ], className='dashboard-card'),
                ], className='dashboard-grid'),
                html.Div([
                    html.Div([
                        html.H2(['Top 5 AO meilleure note technique', help_icon('top5-note-tech', "Les AO avec les meilleures notes techniques"), help_eye('eye-top5-note-tech', "Chaque barre indique le nombre d'AO par AO et par statut. Permet d'identifier les AO avec les meilleures notes techniques.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(
                            id='fig-top5-note-tech',
                            config={'toImageButtonOptions': {'filename': 'top5_note_technique'}}
                        ),
                    ], className='dashboard-card'),
                    html.Div([
                        html.H2(['Radar des moyennes par catégorie', help_icon('radar-notes', "Comparaison des profils moyens de chaque catégorie sur tous les critères de notes"), help_eye('eye-radar-notes', "Chaque point indique la moyenne des notes pour chaque catégorie sur tous les critères de notes.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(
                            id='fig-radar',
                            config={'toImageButtonOptions': {'filename': 'radar_notes_par_categorie'}}
                        ),
                    ], className='dashboard-card'),
                ], className='dashboard-grid'),
                html.Div([
                    html.H2(['Tableau détaillé des AO et notes', help_icon('table-notes', "Liste détaillée des AO, notes, statuts, pôles..."), help_eye('eye-table-notes', "Chaque case indique le nombre d'AO pour une catégorie, une note, un statut, un pôle donnés.")], style={'display': 'flex', 'alignItems': 'center'}),
                    dash_table.DataTable(
                        id='notes-table',
                        columns=[{"name": i, "id": i} for i in notes_table_data.columns],
                        data=notes_table_data.to_dict('records'),
                        style_table={'overflowX': 'auto'},
                        style_cell={'textAlign': 'left', 'fontFamily': 'IBM Plex Sans', 'fontSize': 14, 'padding': '6px'},
                        style_header={'backgroundColor': '#E8F5E9', 'fontWeight': 'bold'},
                        page_size=10,
                    ),
                ], className='dashboard-card', style={'marginTop': '32px'}),
            ]),
            dcc.Tab(label='Analyse des Prix', children=[
                html.Div([
                    html.Div([
                        html.H2(['Graphique Écart de prix', help_icon('bar-ecart-prix', "Identifie les AO trop chers ou trop bas"), help_eye('eye-bar-ecart-prix', "Chaque barre indique le nombre d'AO pour une catégorie et un écart de prix donnés.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_prix_ecart, config={'toImageButtonOptions': {'filename': 'ecart_de_prix'}}),
                    ], className='dashboard-card'),
                    html.Div([
                        html.H2(['Histogramme positionnement du Prix', help_icon('hist-positionnement-prix', "Aide à ajuster la stratégie tarifaire"), help_eye('eye-hist-positionnement-prix', "Chaque barre indique le nombre d'AO pour une catégorie et un positionnement de prix donnés.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_positionnement_prix, config={'toImageButtonOptions': {'filename': 'histogramme_positionnement_prix'}}),
                    ], className='dashboard-card'),
                ], className='dashboard-grid'),
                html.Div([
                    html.Div([
                        html.H2(['Boxplot des prix par catégorie', help_icon('box-prix-cat', "Dispersion des notes prix pour chaque catégorie"), help_eye('eye-box-prix-cat', "Chaque barre indique la dispersion des notes prix pour chaque catégorie.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_box_prix_cat, config={'toImageButtonOptions': {'filename': 'boxplot_prix_categorie'}}),
                    ], className='dashboard-card'),
                    html.Div([
                        html.H2(['Taux de succès par tranche de prix', help_icon('bar-taux-succes-prix', "Part des AO gagnés par tranche de prix"), help_eye('eye-bar-taux-succes-prix', "Chaque barre indique le nombre d'AO gagnés par tranche de prix.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_taux_succes_tranche_prix, config={'toImageButtonOptions': {'filename': 'taux_succes_par_tranche_prix'}}),
                    ], className='dashboard-card'),
                ], className='dashboard-grid'),
                html.Div([
                    html.Div([
                        html.H2(["Nombre d'AO par tranche de prix", help_icon('hist-ao-tranche-prix', "Volume d'AO par niveau de prix"), help_eye('eye-hist-ao-tranche-prix', "Chaque barre indique le nombre d'AO pour une catégorie et un niveau de prix donnés.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_hist_ao_tranche_prix, config={'toImageButtonOptions': {'filename': 'nombre_ao_par_tranche_prix'}}),
                    ], className='dashboard-card'),
                ], className='dashboard-grid'),
                html.Div([
                    html.H2(["Tableau détaillé des AO et prix", help_icon('table-prix', "Liste détaillée des AO, prix, statuts, pôles..."), help_eye('eye-table-prix', "Chaque case indique le nombre d'AO pour une catégorie, un prix, un statut, un pôle donnés.")], style={'display': 'flex', 'alignItems': 'center'}),
                    dash_table.DataTable(
                        columns=[{"name": i, "id": i} for i in prix_table_cols],
                        data=notes_table_data[prix_table_cols].to_dict('records'),
                        style_table={'overflowX': 'auto'},
                        style_cell={'textAlign': 'left', 'fontFamily': 'IBM Plex Sans', 'fontSize': 14, 'padding': '6px'},
                        style_header={'backgroundColor': '#E8F5E9', 'fontWeight': 'bold'},
                        page_size=10,
                    ),
                ], className='dashboard-card', style={'marginTop': '32px'}),
            ]),
            dcc.Tab(label='Comparaison avec gagnant AO', children=[
                html.Div([
                    html.Div([
                        html.H2(['Écart de Score total par AO et Catégorie (Gagnant vs Notre Client)', help_icon('bar-ecart-score', "Identifier rapidement les AO où notre client perd de peu (faible écart) ou largement (écart élevé), et prioriser les axes d'amélioration sur les prochains appels d'offres."), help_eye('eye-bar-ecart-score', "Chaque barre indique le nombre d'AO pour une catégorie et un écart de score donnés.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_ecart_score, config={'toImageButtonOptions': {'filename': 'ecart_score_total'}}),
                    ], className='dashboard-card', style={'maxWidth': '900px', 'margin': '0 auto'}),
                ]),
                html.Div([
                    html.Div([
                        html.H2(["Boxplot de l'écart de score par catégorie", help_icon('box-ecart-cat', "Dispersion des écarts de score par catégorie"), help_eye('eye-box-ecart-cat', "Chaque barre indique la dispersion des écarts de score pour chaque catégorie.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_box_ecart_cat, config={'toImageButtonOptions': {'filename': 'boxplot_ecart_categorie'}}),
                    ], className='dashboard-card'),
                    html.Div([
                        html.H2(["Nombre d'AO par tranche d'écart de score", help_icon('hist-ecart', "Répartition des AO selon l'écart de score"), help_eye('eye-hist-ecart', "Chaque barre indique le nombre d'AO pour une tranche d'écart de score donnée.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_hist_ecart, config={'toImageButtonOptions': {'filename': 'histogramme_tranche_ecart'}}),
                    ], className='dashboard-card'),
                ], className='dashboard-grid'),
                html.Div([
                    html.Div([
                        html.H2(["Top 5 AO écart le plus faible", help_icon('top5-faible-ecart', "AO où le client passe près du gagnant"), help_eye('eye-top5-faible-ecart', "Chaque barre indique le nombre d'AO pour une catégorie et un écart de score faible donnés.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_top5_faible, config={'toImageButtonOptions': {'filename': 'top5_faible_ecart'}}),
                    ], className='dashboard-card'),
                    html.Div([
                        html.H2(["Top 5 AO écart le plus élevé", help_icon('top5-fort-ecart', "AO où le client est loin du gagnant"), help_eye('eye-top5-fort-ecart', "Chaque barre indique le nombre d'AO pour une catégorie et un écart de score élevé donnés.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_top5_fort, config={'toImageButtonOptions': {'filename': 'top5_fort_ecart'}}),
                    ], className='dashboard-card'),
                ], className='dashboard-grid'),
                html.Div([
                    html.Div([
                        html.H2(["Score gagnant vs Score client", help_icon('scatter-score', "Corrélation entre score gagnant et score client"), help_eye('eye-scatter-score', "Chaque point indique le score gagnant et le score client pour un AO donné.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dcc.Graph(figure=fig_scatter_score, config={'toImageButtonOptions': {'filename': 'scatter_score_gagnant_client'}}),
                    ], className='dashboard-card'),
                    html.Div([
                        html.H2(["Tableau détaillé des AO et écarts de score", help_icon('table-ecart', "Liste détaillée des AO, scores, écarts..."), help_eye('eye-table-ecart', "Chaque case indique le nombre d'AO pour une catégorie, un score gagnant, un score client, et un écart donnés.")], style={'display': 'flex', 'alignItems': 'center'}),
                        dash_table.DataTable(
                            columns=[{"name": i, "id": i} for i in ecart_table_cols],
                            data=ecart_score_data[ecart_table_cols].to_dict('records'),
                            style_table={'overflowX': 'auto'},
                            style_cell={'textAlign': 'left', 'fontFamily': 'IBM Plex Sans', 'fontSize': 14, 'padding': '6px'},
                            style_header={'backgroundColor': '#E8F5E9', 'fontWeight': 'bold'},
                            page_size=10,
                        ),
                    ], className='dashboard-card'),
                ], className='dashboard-grid'),
            ]),
        ])
    ], style={'marginLeft': 320, 'padding': 30, 'background': COLORS['fond_secondaire'], 'minHeight': '100vh'}),
], style={'background': COLORS['fond_principal'], 'fontFamily': 'IBM Plex Sans, Arial, sans-serif'}, id='main-root')

# Callback pour le thème
@app.callback(
    Output('main-root', 'className'),
    Output('theme-toggle', 'children'),
    Output('theme-store', 'data'),
    Input('theme-toggle', 'n_clicks'),
    State('theme-store', 'data')
)
def toggle_theme(n_clicks, data):
    theme = data.get('theme', 'light')
    if n_clicks % 2 == 1:
        return 'dark', '☀️', {'theme': 'dark'}
    else:
        return '', '🌙', {'theme': 'light'}

# Callback pour filtres sur l'onglet Analyse des Notes
@app.callback(
    [Output('notes-table', 'data'),
     Output('fig-box-tech', 'figure'),
     Output('fig-hist-note-tranche', 'figure'),
     Output('fig-top5-note-tech', 'figure'),
     Output('fig-radar', 'figure')],
    [Input('filter-categorie', 'value'),
     Input('filter-pole', 'value'),
     Input('filter-statut', 'value'),
     Input('filter-nom-ao', 'value')]
)
def update_notes_tab(categorie, pole, statut, nom_ao):
    df = notes_table_data.copy()
    if categorie:
        df = df[df['Catégorie'].isin(categorie)]
    if pole:
        df = df[df['Pôle'].isin(pole)]
    if statut:
        df = df[df['Statut'].isin(statut)]
    if nom_ao:
        df = df[df['Nom AO'].isin(nom_ao)]
    # Boxplot
    fig_box_tech = px.box(df, x='Catégorie', y='Note technique', color='Catégorie',
        color_discrete_sequence=['#4472C4', '#70AD47', '#ED7D31', '#A5A5A5'])
    # Histogramme par tranche
    bins_note = [0, 10, 12, 14, 16, 20]
    labels_note = ['<10', '10-12', '12-14', '14-16', '16+']
    df['Tranche note technique'] = pd.cut(df['Note technique'], bins=bins_note, labels=labels_note, right=True, include_lowest=True)
    note_tranche_data = df.groupby('Tranche note technique').size().reset_index(name='Nombre AO')
    fig_hist_note_tranche = px.bar(note_tranche_data, x='Tranche note technique', y='Nombre AO', color='Tranche note technique',
        color_discrete_map={'<10': '#D32F2F', '10-12': '#F4B084', '12-14': '#FFE699', '14-16': '#70AD47', '16+': '#00B050'})
    # Top 5
    top5_note_tech = df.nlargest(5, 'Note technique')
    fig_top5_note_tech = px.bar(top5_note_tech, x='Note technique', y='Nom AO', orientation='h', color='Note technique',
        color_continuous_scale=['#FFE699', '#70AD47', '#00B050'])
    # Radar
    radar_data = df.groupby('Catégorie')[['Note technique', 'Note prix', 'Création', 'Équipe', 'Planification', 'RSE']].mean().reset_index()
    fig_radar = go.Figure()
    for i, row in radar_data.iterrows():
        fig_radar.add_trace(go.Scatterpolar(
            r=[row['Note technique'], row['Note prix'], row['Création'], row['Équipe'], row['Planification'], row['RSE'], row['Note technique']],
            theta=['Technique', 'Prix', 'Création', 'Équipe', 'Planification', 'RSE', 'Technique'],
            fill='toself',
            name=row['Catégorie'],
            line=dict(width=2)
        ))
    fig_radar.update_layout(
        polar=dict(radialaxis=dict(visible=True, range=[8, 20])),
        showlegend=True,
        margin=dict(l=40, r=40, t=40, b=40)
    )
    return df.to_dict('records'), fig_box_tech, fig_hist_note_tranche, fig_top5_note_tech, fig_radar

# Callback pour le bouton de réinitialisation
@app.callback(
    [Output('filter-categorie', 'value'),
     Output('filter-pole', 'value'),
     Output('filter-statut', 'value'),
     Output('filter-nom-ao', 'value')],
    [Input('reset-filters', 'n_clicks')],
    [State('filter-categorie', 'value'),
     State('filter-pole', 'value'),
     State('filter-statut', 'value'),
     State('filter-nom-ao', 'value')]
)
def reset_filters(n, cat, pole, statut, nom_ao):
    if n:
        return [sidebar_default_values['categorie'], sidebar_default_values['pole'], sidebar_default_values['statut'], sidebar_default_values['nom_ao']]
    return [cat, pole, statut, nom_ao]

if __name__ == '__main__':
    app.run(debug=True) 