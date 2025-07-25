import React, { useState, useEffect, useCallback } from 'react';
import DashboardGrid from '../../components/DashboardGrid';
import { useAuth } from '../../context/AuthContext';
import { delaiTableColumns, delaiTableData, notesTableColumns, notesTableData, prixTableColumns, prixTableData, ecartTableColumns, ecartTableData } from './BibliothequeGraphiquePage';
import { DashboardWidget, WidgetType } from '../../components/DashboardGrid';
import {
  GagnePerduChart,
  CategorieChart,
  PoleChart,
  GagnePerduEvolutionMoisChart,
  GagnePerduTauxSuccesCategorieChart,
  GagnePerduTauxSuccesPoleChart,
  DelaisChart,
  DelaisStatsChart,
  DelaisParAOChart,
  DelaisTranchesChart,
  Top5DelaisChart,
  NotesChart,
  Top5NotesChart,
  NotesTranchesChart,
  NotesQualitativesChart,
  NotesBoxChart,
  PrixChart,
  PrixTranchesChart,
  PositionnementPrixChart,
  PrixBoxChart,
  TauxSuccesPrixChart,
  ComparaisonChart,
  Top5EcartsChart,
  EcartsCategorieChart,
  EcartsTranchesChart,
  EcartsBoxChart,
  Top5EcartsFaiblesChart,
  Top5EcartsFortsChart
} from './BibliothequeGraphiquePage';
import type { FilterState } from '../../hooks/useGraphData';
import { useFilterOptions } from '../../hooks/useGraphData';
import { v4 as uuidv4 } from 'uuid';
import { Checkbox, FormControl, FormGroup, FormLabel, FormControlLabel, OutlinedInput, Button, Box, Stack, Typography } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { PrixVsNotesChart } from './BibliothequeGraphiquePage';
import Tabs, { TabItem } from '../../components/Tabs';
import { Layout } from 'react-grid-layout';

const mesTableauxTabs: TabItem[] = [
  { label: 'Mes Tableaux de Bords', to: '/visualisation/mes-tableaux-bords' },
];

interface Dashboard {
  id: string;
  nom: string;
  graphiques: any[];
}

const API_URL = 'http://localhost:8000';

// Fonctions de génération de graphiques (copiées depuis BibliothequeGraphiquePage)
function getBarCategorieData(filtres: any) {
  const barCategorieData = [
    { categorie: "Bâtiment", statut: "Gagné", count: 10 },
    { categorie: "Bâtiment", statut: "Perdu", count: 5 },
    { categorie: "Bâtiment", statut: "In progress", count: 2 },
    { categorie: "Informatique", statut: "Gagné", count: 8 },
    { categorie: "Informatique", statut: "Perdu", count: 7 },
    { categorie: "Informatique", statut: "In progress", count: 1 },
    { categorie: "Services", statut: "Gagné", count: 12 },
    { categorie: "Services", statut: "Perdu", count: 9 },
    { categorie: "Services", statut: "In progress", count: 3 },
    { categorie: "Transport", statut: "Gagné", count: 12 },
    { categorie: "Transport", statut: "Perdu", count: 7 },
    { categorie: "Transport", statut: "In progress", count: 4 },
  ];
  
  const categories = ["Bâtiment", "Informatique", "Services", "Transport"];
  const statuts = ["Gagné", "Perdu", "In progress"];
  const filtered = barCategorieData.filter((row: any) =>
    (filtres.categories?.length === 0 || filtres.categories?.includes(row.categorie)) &&
    (filtres.statuts?.length === 0 || filtres.statuts?.includes(row.statut))
  );
  return statuts.map((statut, i) => ({
    x: categories,
    y: categories.map(cat => {
      const found = filtered.find((row: any) => row.categorie === cat && row.statut === statut);
      return found ? found.count : 0;
    }),
    name: statut,
    type: "bar" as const,
    marker: { color: ["#00B050", "#D32F2F", "#F4B084"][i] }
  }));
}

function getPieGagnePerduData(filtres: any) {
  const pieGagnePerduData = [
    { statut: "Gagné", count: 42 },
    { statut: "Perdu", count: 28 },
    { statut: "In progress", count: 10 },
  ];
  
  const filtered = pieGagnePerduData.filter((row: any) =>
    filtres.statuts?.length === 0 || filtres.statuts?.includes(row.statut)
  );
  return [{
    values: filtered.map((row: any) => row.count),
    labels: filtered.map((row: any) => row.statut),
    type: "pie" as const,
    marker: { colors: ["#00B050", "#D32F2F", "#F4B084"] },
    textinfo: "label+percent" as const
  }];
}

// Fonction pour appliquer les filtres aux données de table
function applyFiltersToData(data: any[], filtres: any) {
  return data.filter(row => {
    const categoryMatch = filtres.categories?.length === 0 || filtres.categories?.includes(row.categorie);
    const statutMatch = filtres.statuts?.length === 0 || filtres.statuts?.includes(row.statut);
    const poleMatch = filtres.poles?.length === 0 || filtres.poles?.includes(row.pole);
    
    // Gestion des dates si elles existent
    let dateMatch = true;
    if (filtres.dates && filtres.dates.length === 2) {
      const [dateDebut, dateFin] = filtres.dates;
      if (dateDebut && dateFin && row.date) {
        const rowDate = new Date(row.date);
        const debut = new Date(dateDebut);
        const fin = new Date(dateFin);
        dateMatch = rowDate >= debut && rowDate <= fin;
      }
    }
    
    return categoryMatch && statutMatch && poleMatch && dateMatch;
  });
}

function getBarPoleData(filtres: any) {
  const barPoleData = [
    { pole: "Pôle A", statut: "Gagné", count: 15 },
    { pole: "Pôle B", statut: "Gagné", count: 12 },
    { pole: "Pôle C", statut: "Gagné", count: 15 },
    { pole: "Pôle A", statut: "Perdu", count: 8 },
    { pole: "Pôle B", statut: "Perdu", count: 10 },
    { pole: "Pôle C", statut: "Perdu", count: 10 },
  ];
  const poles = ["Pôle A", "Pôle B", "Pôle C"];
  const statuts = ["Gagné", "Perdu"];
  const filtered = barPoleData.filter((row: any) =>
    (filtres.poles?.length === 0 || filtres.poles?.includes(row.pole)) &&
    (filtres.statuts?.length === 0 || filtres.statuts?.includes(row.statut))
  );
  return statuts.map((statut, i) => ({
    x: poles,
    y: poles.map(pole => {
      const found = filtered.find((row: any) => row.pole === pole && row.statut === statut);
      return found ? found.count : 0;
    }),
    name: statut,
    type: "bar" as const,
    marker: { color: ["#00B050", "#D32F2F"][i] }
  }));
}

function getPiePoleData(filtres: any) {
  const piePoleData = [
    { pole: "Pôle A", count: 20 },
    { pole: "Pôle B", count: 30 },
    { pole: "Pôle C", count: 50 },
  ];
  const filtered = piePoleData.filter((row: any) =>
    filtres.poles?.length === 0 || filtres.poles?.includes(row.pole)
  );
  return [{
    values: filtered.map((row: any) => row.count),
    labels: filtered.map((row: any) => row.pole),
    type: "pie" as const,
    marker: { colors: ["#00B050", "#37966F", "#A5D6A7"] },
    textinfo: "label+percent" as const
  }];
}

function getBarDelaiCategorieData(filtres: any) {
  const barDelaiCategorieData = [
    { categorie: "Bâtiment", delai: 8 },
    { categorie: "Informatique", delai: 12 },
    { categorie: "Services", delai: 6 },
    { categorie: "Transport", delai: 15 },
  ];
  const categories = ["Bâtiment", "Informatique", "Services", "Transport"];
  const filtered = barDelaiCategorieData.filter((row: any) =>
    (filtres.categories?.length === 0 || filtres.categories?.includes(row.categorie))
  );
  return [{
    x: categories,
    y: categories.map(cat => {
      const found = filtered.find((row: any) => row.categorie === cat);
      return found ? found.delai : 0;
    }),
    type: "bar" as const,
    marker: { color: ["#4472C4", "#70AD47", "#ED7D31", "#A5A5A5"] },
  }];
}

function getBarDelaiAOData(filtres: any) {
  const barDelaiAOData = [
    { ao: "AO 1", delai: 10, seuil: "court" },
    { ao: "AO 2", delai: 15, seuil: "long" },
    { ao: "AO 3", delai: 7, seuil: "court" },
    { ao: "AO 4", delai: 12, seuil: "moyen" },
    { ao: "AO 5", delai: 18, seuil: "long" },
  ];
  const filtered = barDelaiAOData.filter((row: any) =>
    (filtres.categories?.length === 0 || filtres.categories?.includes(row.ao)) &&
    (filtres.statuts?.length === 0 || filtres.statuts?.includes(row.seuil))
  );
  return [{
    x: filtered.map(row => row.ao),
    y: filtered.map(row => row.delai),
    type: "bar" as const,
    marker: { color: ["#4472C4", "#70AD47", "#ED7D31", "#A5A5A5", "#FFE699", "#FFC000", "#C6EFCE", "#F4B084"] },
  }];
}

function getBoxTechData(filtres: any) {
  const boxTechData = [
    { categorie: "Bâtiment", note: 12 }, { categorie: "Bâtiment", note: 14 }, { categorie: "Informatique", note: 15 },
    { categorie: "Informatique", note: 13 }, { categorie: "Services", note: 16 }, { categorie: "Services", note: 17 },
    { categorie: "Transport", note: 15 }, { categorie: "Transport", note: 14 }, { categorie: "Bâtiment", note: 13 },
    { categorie: "Informatique", note: 15 }, { categorie: "Services", note: 16 }, { categorie: "Transport", note: 17 },
  ];
  const filtered = boxTechData.filter(row =>
    (filtres.categories?.length === 0 || filtres.categories?.includes(row.categorie))
  );
  return [{
    y: filtered.map(row => row.note),
    x: filtered.map(row => row.categorie),
    type: "box" as const,
    name: "Note technique",
    marker: { color: "#4472C4" },
  }];
}

function getBoxPrixCatData(filtres: any) {
  const boxPrixCatData = [
    { categorie: "Bâtiment", prix: 13 }, { categorie: "Bâtiment", prix: 14 }, { categorie: "Informatique", prix: 15 },
    { categorie: "Informatique", prix: 13 }, { categorie: "Services", prix: 16 }, { categorie: "Services", prix: 17 },
    { categorie: "Transport", prix: 15 }, { categorie: "Transport", prix: 14 }, { categorie: "Bâtiment", prix: 13 },
    { categorie: "Informatique", prix: 15 }, { categorie: "Services", prix: 16 }, { categorie: "Transport", prix: 17 },
  ];
  const filtered = boxPrixCatData.filter((row: any) =>
    (filtres.categories?.length === 0 || filtres.categories?.includes(row.categorie))
  );
  return [{
    y: filtered.map(row => row.prix),
    x: filtered.map(row => row.categorie),
    type: "box" as const,
    name: "Prix",
    marker: { color: "#4472C4" },
  }];
}

function getHeatmapCatStatutData(filtres: any) {
  const heatmapCatStatutData = [
    { categorie: "Bâtiment", statut: "Gagné", count: 5 }, { categorie: "Bâtiment", statut: "Perdu", count: 2 }, { categorie: "Bâtiment", statut: "In progress", count: 1 },
    { categorie: "Informatique", statut: "Gagné", count: 3 }, { categorie: "Informatique", statut: "Perdu", count: 4 }, { categorie: "Informatique", statut: "In progress", count: 2 },
    { categorie: "Services", statut: "Gagné", count: 2 }, { categorie: "Services", statut: "Perdu", count: 1 }, { categorie: "Services", statut: "In progress", count: 3 },
    { categorie: "Transport", statut: "Gagné", count: 4 }, { categorie: "Transport", statut: "Perdu", count: 3 }, { categorie: "Transport", statut: "In progress", count: 2 },
  ];
  const categories = ["Bâtiment", "Informatique", "Services", "Transport"];
  const statuts = ["Gagné", "Perdu", "In progress"];
  const filtered = heatmapCatStatutData.filter(row =>
    (filtres.categories?.length === 0 || filtres.categories?.includes(row.categorie)) &&
    (filtres.statuts?.length === 0 || filtres.statuts?.includes(row.statut))
  );
  const z = categories.map(cat => statuts.map(st => {
    const found = filtered.find(row => row.categorie === cat && row.statut === st);
    return found ? found.count : 0;
  }));
  return [{
    z,
    x: statuts,
    y: categories,
    type: "heatmap" as const,
    colorscale: "Greens",
    colorbar: { title: { text: "Nombre AO" } },
  }];
}

function getScatterPrixNoteData(filtres: any) {
  const scatterPrixNoteData = [
    { prix: 10000, note: 12, categorie: "Bâtiment", statut: "Gagné", pole: "Pôle A" },
    { prix: 20000, note: 15, categorie: "Informatique", statut: "Perdu", pole: "Pôle B" },
    { prix: 30000, note: 14, categorie: "Services", statut: "Gagné", pole: "Pôle C" },
    { prix: 40000, note: 18, categorie: "Transport", statut: "In progress", pole: "Pôle A" },
    { prix: 50000, note: 16, categorie: "Bâtiment", statut: "Gagné", pole: "Pôle B" },
  ];
  const filtered = scatterPrixNoteData.filter(row =>
    (filtres.categories?.length === 0 || filtres.categories?.includes(row.categorie)) &&
    (filtres.statuts?.length === 0 || filtres.statuts?.includes(row.statut)) &&
    (filtres.poles?.length === 0 || filtres.poles?.includes(row.pole))
  );
  return [{
    x: filtered.map(row => row.prix),
    y: filtered.map(row => row.note),
    mode: "markers" as const,
    type: "scatter" as const,
    marker: { size: 14, color: filtered.map(row => row.note), colorscale: ["#4472C4", "#00B050"] },
    text: filtered.map(row => row.categorie),
  }];
}

function getTauxSuccesPoleData(filtres: any) {
  // Dummy data
  const poles = ["Pôle A", "Pôle B", "Pôle C"];
  const taux = [0.7, 0.6, 0.8];
  return [{
    x: poles,
    y: taux,
    type: "bar" as const,
    marker: { color: ["#4472C4", "#70AD47", "#ED7D31"] },
  }];
}

function getTauxSuccesCatData(filtres: any) {
  const categories = ["Bâtiment", "Informatique", "Services", "Transport"];
  const taux = [0.6, 0.7, 0.65, 0.8];
  return [{
    x: categories,
    y: taux,
    type: "bar" as const,
    marker: { color: ["#4472C4", "#70AD47", "#ED7D31", "#A5A5A5"] },
  }];
}

function getTauxSuccesMoisData(filtres: any) {
  const mois = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const taux = [0.5, 0.6, 0.7, 0.8, 0.65, 0.7, 0.75, 0.8, 0.7, 0.6, 0.55, 0.6];
  return [{
    x: mois,
    y: taux,
    mode: "lines+markers" as const,
    name: "Taux de succès",
    line: { color: "#00B050", width: 3 },
  }];
}

function getHistAOMoisData(filtres: any) {
  const mois = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const y = [12, 15, 18, 20, 17, 19, 22, 24, 20, 18, 16, 14];
  return [{
    x: mois,
    y: y,
    type: "bar" as const,
    marker: { color: "#37966F" },
  }];
}

// Mapping centralisé entre graph_id et composant React
const graphComponentMap: Record<string, React.FC<{ filters: FilterState }>> = {
  'gagne-perdu-pie': GagnePerduChart,
  'bar_categorie': CategorieChart,
  'bar_pole': PoleChart,
  'gagne-perdu-evolution-mois': GagnePerduEvolutionMoisChart,
  'gagne-perdu-taux-succes-categorie': GagnePerduTauxSuccesCategorieChart,
  'gagne-perdu-taux-succes-pole': GagnePerduTauxSuccesPoleChart,
  'delais-bar': DelaisChart,
  'delais-stats': DelaisStatsChart,
  'delais-par-ao': DelaisParAOChart,
  'delais-tranches': DelaisTranchesChart,
  'top5-delais': Top5DelaisChart,
  'notes-bar': NotesChart,
  'top5-notes': Top5NotesChart,
  'notes-tranches': NotesTranchesChart,
  'notes-qualitatives': NotesQualitativesChart,
  'notes-box': NotesBoxChart,
  'prix-bar': PrixChart,
  'prix-tranches': PrixTranchesChart,
  'positionnement-prix': PositionnementPrixChart,
  'prix-box': PrixBoxChart,
  'taux-succes-prix': TauxSuccesPrixChart,
  'comparaison-scores': ComparaisonChart,
  'top5-ecarts': Top5EcartsChart,
  'ecarts-categorie': EcartsCategorieChart,
  'ecarts-tranches': EcartsTranchesChart,
  'ecarts-box': EcartsBoxChart,
  'top5-ecarts-faibles': Top5EcartsFaiblesChart,
  'top5-ecarts-forts': Top5EcartsFortsChart,
  'notes-distribution': NotesChart,
  'prix-vs-notes': PrixVsNotesChart,
  'delais-categorie': DelaisChart,
  'gagne-perdu-categorie': CategorieChart,
  'gagne-perdu-pole': PoleChart,
};

// Mapping des descriptions pour chaque graph_id (exemples, à éditer facilement)
const graphDescriptionMap: Record<string, string> = {
  'gagne-perdu-pie': "Ce graphique montre la répartition des appels d'offres gagnés et perdus. Il permet d'évaluer la performance globale.",
  'bar_categorie': "Répartition des AO par catégorie et statut. Permet d'identifier les domaines les plus performants.",
  'bar_pole': "Répartition des AO par pôle et statut. Permet de comparer les performances des différents pôles.",
  'comparaison-scores': "Compare le score du client à celui du gagnant pour chaque AO.",
  'delais-par-ao': "Affiche le délai de traitement pour chaque appel d'offres.",
  'ecarts-box': "Distribution des écarts de score entre le client et le gagnant, par catégorie.",
  // ... Ajoute d'autres descriptions ici ...
};

// Composant WidgetFilters (identique à la bibliothèque)
export const WidgetFilters: React.FC<{
  filters: FilterState;
  onChange: (filterType: keyof FilterState, value: string | string[]) => void;
}> = ({ filters, onChange }) => {
  const { options, loading } = useFilterOptions();

  return (
    <Box sx={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 3,
      alignItems: 'center',
      bgcolor: 'background.paper',
      borderRadius: 2,
      p: 2,
      mb: 2,
      boxShadow: 1,
    }}>
      <FormControl component="fieldset" sx={{ minWidth: 180 }}>
        <FormLabel component="legend">Catégories</FormLabel>
        <FormGroup row>
          {loading ? (
            <Typography variant="body2">Chargement...</Typography>
          ) : (
            options.categories.map(cat => (
              <FormControlLabel
                key={cat}
                control={
                  <Checkbox
                    checked={Array.isArray(filters.categories) && filters.categories.includes(cat)}
                    onChange={e => {
                      const newVal = e.target.checked
                        ? [...(filters.categories || []), cat]
                        : (filters.categories || []).filter(c => c !== cat);
                      onChange('categories', newVal);
                    }}
                    color="primary"
                  />
                }
                label={cat}
              />
            ))
          )}
        </FormGroup>
      </FormControl>
      <FormControl component="fieldset" sx={{ minWidth: 180 }}>
        <FormLabel component="legend">Statuts</FormLabel>
        <FormGroup row>
          {loading ? (
            <Typography variant="body2">Chargement...</Typography>
          ) : (
            options.statuts.map(st => (
              <FormControlLabel
                key={st}
                control={
                  <Checkbox
                    checked={Array.isArray(filters.statuts) && filters.statuts.includes(st)}
                    onChange={e => {
                      const newVal = e.target.checked
                        ? [...(filters.statuts || []), st]
                        : (filters.statuts || []).filter(s => s !== st);
                      onChange('statuts', newVal);
                    }}
                    color="primary"
                  />
                }
                label={st}
              />
            ))
          )}
        </FormGroup>
      </FormControl>
      <FormControl component="fieldset" sx={{ minWidth: 180 }}>
        <FormLabel component="legend">Pôles</FormLabel>
        <FormGroup row>
          {loading ? (
            <Typography variant="body2">Chargement...</Typography>
          ) : (
            options.poles.map(pole => (
              <FormControlLabel
                key={pole}
                control={
                  <Checkbox
                    checked={Array.isArray(filters.poles) && filters.poles.includes(pole)}
                    onChange={e => {
                      const newVal = e.target.checked
                        ? [...(filters.poles || []), pole]
                        : (filters.poles || []).filter(p => p !== pole);
                      onChange('poles', newVal);
                    }}
                    color="primary"
                  />
                }
                label={pole}
              />
            ))
          )}
        </FormGroup>
      </FormControl>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormLabel>Période</FormLabel>
          <DatePicker
            label="Début"
            value={parseDate(filters.dateDebut)}
            onChange={(date: Date | null) => onChange('dateDebut', formatDate(date))}
            slotProps={{ textField: { size: 'small', sx: { minWidth: 120 } } }}
          />
          <Typography variant="body2">à</Typography>
          <DatePicker
            label="Fin"
            value={parseDate(filters.dateFin)}
            onChange={(date: Date | null) => onChange('dateFin', formatDate(date))}
            slotProps={{ textField: { size: 'small', sx: { minWidth: 120 } } }}
          />
        </Stack>
      </LocalizationProvider>
    </Box>
  );
};

// Ajout du bouton Exporter (placeholder)
const ExportButton = () => (
  <button className="export-btn" disabled style={{ float: 'right', margin: '16px' }}>
    Exporter (bientôt)
  </button>
);

const parseDate = (str: string | undefined) => {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};
const formatDate = (date: Date | null) => (date instanceof Date && !isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : '');

const MesTableauxBordsPage: React.FC = () => {
  const { token } = useAuth();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({}); // Gérer la disposition ici
  
  // Filtres globaux pour le dashboard (comme dans la bibliothèque)
  const [globalFilters, setGlobalFilters] = useState<FilterState>({
    categories: [],
    statuts: [],
    poles: [],
    dateDebut: '',
    dateFin: '',
  });
  
  // Options de filtres depuis MongoDB
  const { options: filterOptions, loading: filterOptionsLoading } = useFilterOptions();

  // Gestion des filtres globaux
  const handleGlobalFilterChange = useCallback((filterType: keyof FilterState, value: string | string[]) => {
    setGlobalFilters((prev: FilterState) => ({
      ...prev,
      [filterType]: Array.isArray(value) ? value : [value]
    }));
  }, []);

  const resetGlobalFilters = useCallback(() => {
    setGlobalFilters({
      categories: [],
      statuts: [],
      poles: [],
      dateDebut: '',
      dateFin: '',
    });
  }, []);

  // Sauvegarder les filtres globaux du dashboard
  const saveGlobalFilters = useCallback(async () => {
    if (!selectedDashboard || !token) return;
    try {
      console.log('Sauvegarde des filtres globaux:', globalFilters);
      const response = await fetch(`${API_URL}/dashboards/${selectedDashboard}/update_global_filtres`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filtres: globalFilters })
      });
      if (!response.ok) {
        console.error('Erreur lors de la sauvegarde des filtres globaux');
      } else {
        console.log('Filtres globaux sauvegardés avec succès');
      }
    } catch (err) {
      console.error('Erreur sauvegarde filtres globaux:', err);
    }
  }, [selectedDashboard, token, globalFilters]);

  // Sauvegarder automatiquement les filtres quand ils changent (avec délai pour éviter les appels trop fréquents)
  useEffect(() => {
    if (!selectedDashboard || !token) return;
    
    const timeoutId = setTimeout(() => {
      saveGlobalFilters();
    }, 500); // Délai de 500ms pour éviter les appels trop fréquents
    
    return () => clearTimeout(timeoutId);
  }, [globalFilters, selectedDashboard, token]); // Retirer saveGlobalFilters des dépendances

  // Charger les dashboards de l'utilisateur connecté
  useEffect(() => {
    if (!token) {
      console.warn('Token manquant, redirection vers login ou affichage d\'une erreur');
      return;
    }
    console.log('Token utilisé pour fetch:', token);
    setLoading(true);
    setError('');
    fetch(`${API_URL}/dashboards/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async res => {
        if (!res.ok) throw new Error('Erreur lors du chargement');
        const data = await res.json();
        setDashboards(data.map((d: any) => ({ id: d.id || d._id, nom: d.nom, graphiques: d.graphiques || [] })));
        setSelectedDashboard(data[0]?.id || data[0]?._id || '');
      })
      .catch(() => setError('Impossible de charger les tableaux de bords'))
      .finally(() => setLoading(false));
  }, [token]);

  // Charger les widgets ET la disposition du dashboard
  useEffect(() => {
    if (!selectedDashboard || !token) return;
    setLoading(true);
    fetch(`${API_URL}/dashboards/${selectedDashboard}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async res => {
        if (!res.ok) throw new Error('Erreur lors du chargement des widgets');
        const data = await res.json();
        
        // Assigner un instance_id unique à chaque widget s'il n'en a pas
        (data.graphiques || []).forEach((g: any) => {
          if (!g.instance_id) {
            g.instance_id = uuidv4();
          }
        });

        let filtresGlobaux = data.filtres_globaux || {
          categories: [],
          statuts: [],
          poles: [],
          dateDebut: '',
          dateFin: '',
        };
        setGlobalFilters(filtresGlobaux);
        const widgetsFromDb: DashboardWidget[] = (data.graphiques || []).map((g: any) => {
          const GraphComponent = graphComponentMap[g.graph_id];
          const description = graphDescriptionMap[g.graph_id] || '';
          return {
            id: g.graph_id,
            instance_id: g.instance_id,
            type: g.type || 'plotly',
            title: g.titre,
            text: g.text || '',
            size: g.size || 'half',
            height: g.height || 'medium',
            customComponent: GraphComponent ? <GraphComponent filters={globalFilters} /> : undefined,
            description,
            customTitle: g.customTitle || '',
            // Ajouter les propriétés de layout ici
            x: g.x,
            y: g.y,
            w: g.w,
            h: g.h,
          };
        });
        setWidgets(widgetsFromDb);

        const layoutFromWidgets = widgetsFromDb.map((w, i) => ({
          i: w.instance_id,
          x: w.x ?? (i % 2) * 6,
          y: w.y ?? Math.floor(i / 2) * 4,
          w: w.w ?? 6,
          h: w.h ?? 6,
        }));
        setLayouts({ lg: layoutFromWidgets });
      })
      .catch(() => setError('Impossible de charger les widgets'))
      .finally(() => setLoading(false));
  }, [selectedDashboard, token]);

  // Créer un dashboard
  const handleCreate = async () => {
    if (!newName.trim() || !token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/dashboards/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nom: newName.trim(), graphiques: [] }),
      });
      if (!res.ok) throw new Error('Erreur lors de la création');
      const data = await res.json();
      setDashboards(ds => [...ds, { id: data.id || data._id, nom: data.nom, graphiques: [] }]);
      setSelectedDashboard(data.id || data._id);
      setNewName('');
      setShowCreate(false);
    } catch {
      setError('Impossible de créer le tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un dashboard
  const handleDelete = async () => {
    if (!deleteId || !token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/dashboards/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      setDashboards(ds => ds.filter(d => d.id !== deleteId));
      if (selectedDashboard === deleteId && dashboards.length > 1) {
        const next = dashboards.find(d => d.id !== deleteId);
        setSelectedDashboard(next ? next.id : '');
      }
      setDeleteId('');
      setShowDelete(false);
    } catch {
      setError('Impossible de supprimer le tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement de disposition
  const handleLayoutChange = (layout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    setLayouts(allLayouts);
    if (!selectedDashboard || !token) return;
    const layoutToSave = layout.map(l => ({
      instance_id: l.i,
      x: l.x,
      y: l.y,
      w: l.w,
      h: l.h
    }));
    fetch(`${API_URL}/dashboards/${selectedDashboard}/layout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(layoutToSave),
    });
  };

  // Supprimer un widget du dashboard
  const handleRemoveWidget = async (instanceId: string) => {
    setWidgets(widgets.filter(w => w.instance_id !== instanceId));
    if (!selectedDashboard || !token) return;
    await fetch(`${API_URL}/dashboards/${selectedDashboard}/remove_graphique/${instanceId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  // Ajout d'une section de texte
  const handleAddTextSection = async () => {
    if (!selectedDashboard || !token) return;
    const newWidget: DashboardWidget = {
      id: 'section_' + uuidv4(),
      instance_id: uuidv4(),
      type: 'section' as WidgetType,
      title: 'Section de texte',
      text: '',
      size: 'half',
      height: 'medium',
    };
    setWidgets(ws => [...ws, newWidget]);
    // Appel backend pour ajouter le widget texte
    await fetch(`${API_URL}/dashboards/${selectedDashboard}/add_graphique`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ graph_id: newWidget.id, titre: newWidget.title, type: 'section', text: '' })
    });
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Tabs tabs={mesTableauxTabs} />
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 dark:bg-dark-backgroundSecondary">
        <h1 className="text-2xl font-title font-bold mb-6 text-primary dark:text-dark-primary">Mes Tableaux de Bords</h1>
        <div className="flex items-center justify-between bg-gradient-to-r from-primary to-green-700 rounded-b-xl px-8 py-6 mb-4">
          <h1 className="font-title text-3xl font-bold text-white m-0">{dashboards.find(d => d.id === selectedDashboard)?.nom || 'Tableau de bord'}</h1>
          <ExportButton />
        </div>
        <div className="flex gap-4 mb-4">
          <button className="bg-primary text-white rounded-md px-4 py-2 font-body font-medium transition hover:bg-hover hover:text-text shadow" onClick={() => setShowCreate(s => !s)} disabled={loading}>
            + Créer un tableau de bord
          </button>
          <button className="bg-primary text-white rounded-md px-4 py-2 font-body font-medium transition hover:bg-hover hover:text-text shadow" onClick={() => setShowDelete(s => !s)} disabled={loading || dashboards.length === 0}>
            – Supprimer un tableau de bord
          </button>
        </div>
        {showCreate && (
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              placeholder="Nom du tableau de bord"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="px-3 py-2 border border-border rounded font-body text-base focus:border-primary focus:outline-none"
              disabled={loading}
            />
            <button className="bg-primary text-white rounded-md px-4 py-2 font-body font-medium transition hover:bg-hover hover:text-text shadow" onClick={handleCreate} disabled={loading}>
              Créer
            </button>
            <button className="bg-secondary text-text rounded-md px-4 py-2 font-body font-medium transition hover:bg-hover shadow" onClick={() => setShowCreate(false)} disabled={loading}>
              Annuler
            </button>
          </div>
        )}
        {showDelete && (
          <div className="flex items-center gap-2 mb-3">
            <select
              value={deleteId}
              onChange={e => setDeleteId(e.target.value)}
              className="px-3 py-2 border border-border rounded font-body text-base focus:border-primary focus:outline-none"
              disabled={loading}
            >
              <option value="">Choisir un tableau de bord</option>
              {dashboards.map(d => (
                <option key={d.id} value={d.id}>{d.nom}</option>
              ))}
            </select>
            <button className="bg-primary text-white rounded-md px-4 py-2 font-body font-medium transition hover:bg-hover hover:text-text shadow" onClick={handleDelete} disabled={!deleteId || loading}>
              Supprimer
            </button>
            <button className="bg-secondary text-text rounded-md px-4 py-2 font-body font-medium transition hover:bg-hover shadow" onClick={() => setShowDelete(false)} disabled={loading}>
              Annuler
            </button>
          </div>
        )}
        {error && <div className="text-error bg-red-50 border border-red-200 rounded-lg p-4 text-center font-body text-sm font-medium mb-4">{error}</div>}
        {loading && <div className="text-primary mb-3">Chargement...</div>}
        <div className="mb-4">
          <button className="bg-primary text-white rounded-md px-4 py-2 font-body font-medium transition hover:bg-hover hover:text-text shadow" onClick={handleAddTextSection} disabled={loading || !selectedDashboard}>
            + Ajouter une section de texte
          </button>
        </div>
        <nav className="flex gap-3 mb-4">
          {dashboards.map(d => (
            <button
              key={d.id}
              className={`px-5 py-2 rounded-t-lg font-body text-base transition ${selectedDashboard === d.id ? 'bg-primary text-white font-bold' : 'bg-backgroundSecondary text-primary hover:bg-hover'}`}
              onClick={() => setSelectedDashboard(d.id)}
              disabled={loading}
            >
              {d.nom}
            </button>
          ))}
        </nav>
        <div className="mt-3">
          <DashboardGrid
            widgets={selectedDashboard ? widgets : []}
            layouts={layouts}
            onLayoutChange={handleLayoutChange}
            editable={!!selectedDashboard}
            globalFilters={globalFilters} // Laisser cette prop
            onRemoveWidget={handleRemoveWidget}
            dashboardId={selectedDashboard}
            token={token}
          />
        </div>
      </div>
    </div>
  );
};

export { graphComponentMap };
export default MesTableauxBordsPage; 