import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DataTable, DataTableColumn } from "../../components/DataTable";
import { useAuth } from '../../context/AuthContext';
import { 
  useGagnePerduData, 
  useCategorieData, 
  usePoleData, 
  useDelaisData, 
  useNotesData, 
  usePrixData, 
  useComparaisonData, 
  useTop5Data,
  useFilterOptions,
  useDelaisStats,
  useDelaisParAO,
  useDelaisTranches,
  useTop5Delais,
  useNotesTranches,
  useNotesQualitatives,
  useNotesBox,
  usePrixTranches,
  usePositionnementPrix,
  usePrixBox,
  useTauxSuccesPrix,
  useEcartsCategorie,
  useEcartsTranches,
  useEcartsBox,
  useTop5EcartsFaibles,
  useTop5EcartsForts,
  useGagnePerduEvolutionMois,
  useGagnePerduTauxSuccesCategorie,
  useGagnePerduTauxSuccesPole,
  FilterState
} from '../../hooks/useGraphData';
import NivoLineChart from '../../components/NivoLineChart';
import NivoBarChart from '../../components/NivoBarChart';
import NivoPieChart from '../../components/NivoPieChart';
import NivoBoxPlot from '../../components/NivoBoxPlot';
import NivoScatterPlot from '../../components/NivoScatterPlot';
import Tabs, { TabItem } from '../../components/Tabs';

// Types et interfaces
interface GraphChart {
  id: string;
  title: string;
  description: string;
  category: string;
  plot: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
}

interface Dashboard {
  id: string;
  nom: string;
}

// Configuration des onglets
const TABS = [
  { id: "gagne-perdu", label: "Analyse Gagné/Perdu" },
  { id: "delais", label: "Analyse des Délais" },
  { id: "notes", label: "Analyse des Notes" },
  { id: "prix", label: "Analyse des Prix" },
  { id: "comparaison", label: "Comparaison avec gagnant AO" }
] as const;

type TabId = typeof TABS[number]["id"];

// Hooks personnalisés
const useGraphLibrary = () => {
  const [activeTab, setActiveTab] = useState<TabId>("gagne-perdu");
  const [selectedDashboard, setSelectedDashboard] = useState<string>("");
  const [addedGraphs, setAddedGraphs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    statuts: [],
    poles: [],
    dateDebut: "",
    dateFin: "",
  });

  const { token } = useAuth();

  // Récupération des options de filtres depuis MongoDB
  const { options: filterOptions, loading: filterOptionsLoading, error: filterOptionsError } = useFilterOptions();

  // Gestion des filtres
  const handleFilterChange = useCallback((filterType: keyof FilterState, value: string | string[]) => {
    setFilters((prev: FilterState) => ({
      ...prev,
      [filterType]: Array.isArray(value) ? value : [value]
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      categories: [],
      statuts: [],
      poles: [],
      dateDebut: "",
      dateFin: "",
    });
  }, []);

  // Gestion des graphiques
  const addGraphToDashboard = useCallback(async (graphId: string, graphTitle: string) => {
    if (!selectedDashboard) return;
    setLoading(true);
    setError("");
    const filtersForApi = {
      ...filters,
      dateDebut: filters.dateDebut ? [filters.dateDebut] : [],
      dateFin: filters.dateFin ? [filters.dateFin] : [],
    };
    try {
      const res = await fetch(`/dashboards/${selectedDashboard}/add_graphique`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ graph_id: graphId, titre: graphTitle, filtres: filtersForApi })
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("Réponse API:", text);
        throw new Error("Erreur API");
      }
      const data = await res.json();
      setAddedGraphs(new Set(data.graphiques?.map((g: any) => g.graph_id)));
    } catch (err) {
      setError("Erreur lors de l'ajout du graphique");
      console.error("Erreur API ajout graphique:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDashboard, token, filters]);

  const removeGraphFromDashboard = useCallback(async (graphId: string) => {
    if (!selectedDashboard) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/dashboards/${selectedDashboard}/remove_graphique/${graphId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erreur API");
      const data = await res.json();
      setAddedGraphs(new Set(data.graphiques?.map((g: any) => g.graph_id)));
    } catch (err) {
      setError("Erreur lors de la suppression du graphique");
    } finally {
      setLoading(false);
    }
  }, [selectedDashboard, token]);

  // Chargement des dashboards
  useEffect(() => {
    const loadDashboards = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/dashboards/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Erreur API");
        const data = await res.json();
        const dashboardsWithId = data.map((d: any) => ({
          ...d,
          id: d.id || d._id,
        }));
        setDashboards(dashboardsWithId);
        if (dashboardsWithId.length > 0) {
          setSelectedDashboard(dashboardsWithId[0].id);
        }
      } catch (err) {
        setError("Erreur lors du chargement des dashboards");
        console.error("Erreur chargement dashboards:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) loadDashboards();
  }, [token]);

  // Charge les graphiques du dashboard sélectionné
  useEffect(() => {
    const loadDashboardGraphs = async () => {
      if (!selectedDashboard) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/dashboards/${selectedDashboard}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Erreur API");
        const data = await res.json();
        setAddedGraphs(new Set(data.graphiques?.map((g: any) => g.graph_id) || []));
      } catch (err) {
        setError("Erreur lors du chargement des graphiques du dashboard");
        console.error("Erreur chargement graphiques dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token && selectedDashboard) loadDashboardGraphs();
  }, [token, selectedDashboard]);

  return {
    activeTab,
    setActiveTab,
    selectedDashboard,
    setSelectedDashboard,
    addedGraphs,
    loading,
    error,
    dashboards,
    filters,
    filterOptions,
    filterOptionsLoading,
    filterOptionsError,
    handleFilterChange,
    resetFilters,
    addGraphToDashboard,
    removeGraphFromDashboard,
  };
}; 

// Fonction utilitaire pour vérifier si un graphique est dans le dashboard sélectionné
const isGraphInDashboard = (graphId: string, addedGraphs: Set<string>, selectedDashboard: string | null): boolean => {
  if (!selectedDashboard || !addedGraphs) return false;
  return addedGraphs.has(graphId);
};

// Composant pour l'indicateur de présence dans le dashboard
const DashboardIndicator: React.FC<{ isInDashboard: boolean }> = ({ isInDashboard }) => {
  if (!isInDashboard) return null;
  
  return (
    <div className="dashboard-indicator">
      <span className="indicator-icon">✓</span>
      <span className="indicator-text">Dans le dashboard</span>
    </div>
  );
};

// Composants de graphiques utilisant les données MongoDB
export const GagnePerduChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useGagnePerduData(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].labels && data[0].values) {
    nivoData = data[0].labels.map((label: string, i: number) => ({
      id: label,
      value: data[0].values[i]
    }));
  } else if (Array.isArray(data)) {
    nivoData = data.map((d: any) => ({
      id: d._id || d.statut,
      value: d.count,
      label: d.statut
    }));
  }
  return (
    <NivoPieChart
      data={nivoData}
      height={350}
      colors={["#00B050", "#D32F2F", "#F4B084"]}
      margin={{ top: 40, right: 40, bottom: 50, left: 40 }}
      innerRadius={0.5}
      padAngle={0.7}
      cornerRadius={3}
      themeOverrides={{ fontSize: 16 }}
      legends={[
        {
          anchor: 'bottom',
          direction: 'row',
          justify: false,
          translateY: 36,
          itemWidth: 100,
          itemHeight: 18,
          itemsSpacing: 0,
          symbolSize: 18,
          symbolShape: 'circle',
        },
      ]}
    />
  );
};

export const CategorieChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useCategorieData(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].x && data[0].y) {
    nivoData = data[0].x.map((categorie: string, i: number) => ({
      categorie: `${categorie}-${i}`,
      count: data[0].y[i]
    }));
  } else if (Array.isArray(data)) {
    nivoData = data.map((d: any, i: number) => ({
      categorie: `${d._id}-${i}`,
      count: d.count
    }));
  }
  return (
    <NivoBarChart
      data={nivoData}
      keys={["count"]}
      indexBy="categorie"
      height={350}
      colors={["#70AD47"]}
      axisBottomLegend="Catégorie"
      axisLeftLegend="Nombre d'AO"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
      legendLabel="Catégorie"
    />
  );
};

export const PoleChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = usePoleData(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].x && data[0].y) {
    nivoData = data[0].x.map((categorie: string, i: number) => ({
      categorie: `${categorie}-${i}`,
      count: data[0].y[i]
    }));
  } else if (Array.isArray(data)) {
    nivoData = data.map((d: any, i: number) => ({
      categorie: `${d._id}-${i}`,
      count: d.count
    }));
  }
  return (
    <NivoBarChart
      data={nivoData}
      keys={["count"]}
      indexBy="categorie"
      height={350}
      colors={["#4472C4"]}
      axisBottomLegend="Pôle"
      axisLeftLegend="Nombre d'AO"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
      legendLabel="Pôle"
    />
  );
};

// Composant pour l'évolution du taux de succès par mois
export const GagnePerduEvolutionMoisChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useGagnePerduEvolutionMois(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].x && data[0].y) {
    nivoData = [{
      id: 'Taux de succès (%)',
      data: data[0].x.map((x: string, i: number) => ({ x, y: data[0].y[i] }))
    }];
  } else if (Array.isArray(data)) {
    nivoData = [
      {
        id: 'Taux de succès (%)',
        data: data.map((d: any) => ({ x: d.mois, y: d.taux_succes }))
      }
    ];
  }
  return (
    <NivoLineChart
      data={nivoData}
      height={400}
      colors={["#00B050"]}
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
      axisBottom={{ legend: 'Mois', legendPosition: 'middle', legendOffset: 36, tickRotation: -30 }}
      axisLeft={{ legend: 'Taux de succès (%)', legendPosition: 'middle', legendOffset: -40, tickValues: [0, 20, 40, 60, 80, 100] }}
      themeOverrides={{ fontSize: 16 }}
    />
  );
};

// Composant pour le taux de succès par catégorie
export const GagnePerduTauxSuccesCategorieChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useGagnePerduTauxSuccesCategorie(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].x && data[0].y) {
    nivoData = data[0].x.map((categorie: string, i: number) => ({
      categorie,
      'Taux de succès (%)': data[0].y[i]
    }));
  } else if (Array.isArray(data)) {
    nivoData = data.map((d: any) => ({
      categorie: d._id,
      'Taux de succès (%)': d.taux_succes
    }));
  }
  return (
    <NivoBarChart
      data={nivoData}
      keys={['Taux de succès (%)']}
      indexBy="categorie"
      height={350}
      colors={nivoData.map((d: any) => d['Taux de succès (%)'] > 50 ? '#00B050' : '#D32F2F')}
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
      axisBottom={{ legend: 'Catégorie', legendPosition: 'middle', legendOffset: 36, tickRotation: -30 }}
      axisLeft={{ legend: 'Taux de succès (%)', legendPosition: 'middle', legendOffset: -40, tickValues: [0, 20, 40, 60, 80, 100] }}
      themeOverrides={{ fontSize: 16 }}
    />
  );
};

// Composant pour le taux de succès par pôle
export const GagnePerduTauxSuccesPoleChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useGagnePerduTauxSuccesPole(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].x && data[0].y) {
    nivoData = data[0].x.map((pole: string, i: number) => ({
      pole,
      'Taux de succès (%)': data[0].y[i]
    }));
  } else if (Array.isArray(data)) {
    nivoData = data.map((d: any) => ({
      pole: d._id,
      'Taux de succès (%)': d.taux_succes
    }));
  }
  return (
    <NivoBarChart
      data={nivoData}
      keys={['Taux de succès (%)']}
      indexBy="pole"
      height={350}
      colors={nivoData.map((d: any) => d['Taux de succès (%)'] > 50 ? '#00B050' : '#D32F2F')}
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
      axisBottom={{ legend: 'Pôle', legendPosition: 'middle', legendOffset: 36, tickRotation: -30 }}
      axisLeft={{ legend: 'Taux de succès (%)', legendPosition: 'middle', legendOffset: -40, tickValues: [0, 20, 40, 60, 80, 100] }}
      themeOverrides={{ fontSize: 16 }}
    />
  );
};

// Composants pour l'onglet Délais
export const DelaisChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useDelaisData(filters);
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].x && data[0].y) {
    nivoData = data[0].x.map((categorie: string, i: number) => ({
      categorie: `${categorie}-${i}`,
      delai_moyen: data[0].y[i]
    }));
  } else if (Array.isArray(data)) {
    nivoData = data.map((d: any, i: number) => ({
      categorie: `${d._id || d.categorie}-${i}`,
      delai_moyen: d.delai_moyen
    }));
  }
  return (
    <NivoBarChart
      data={nivoData}
      keys={["delai_moyen"]}
      indexBy="categorie"
      height={350}
      colors={["#4472C4"]}
      axisBottomLegend="Catégorie"
      axisLeftLegend="Délai (jours)"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
      legendLabel="Catégorie"
    />
  );
};

export const DelaisStatsChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useDelaisStats(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  const nivoData = data.map((d: any, i: number) => ({
    categorie: `${d._id}-${i}`,
    delai_moyen: d.delai_moyen
  }));
  return (
    <NivoBarChart
      data={nivoData}
      keys={["delai_moyen"]}
      indexBy="categorie"
      height={350}
      colors={["#4472C4"]}
      axisBottomLegend="Catégorie"
      axisLeftLegend="Délai moyen (jours)"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
      legendLabel="Catégorie"
    />
  );
};

export const DelaisParAOChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useDelaisParAO(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  const nivoData = data.map((d: any, i: number) => ({
    nom_ao: `${d.nom_ao}-${i}`,
    delai_jours: d.delai_jours
  }));
  return (
    <NivoBarChart
      data={nivoData}
      keys={["delai_jours"]}
      indexBy="nom_ao"
      height={350}
      colors={["#FF6B6B"]}
      axisBottomLegend="Appel d'Offres"
      axisLeftLegend="Délai (jours)"
      margin={{ top: 40, right: 40, bottom: 80, left: 60 }}
      legendLabel="Appel d'Offres"
      xAxisTickRotation={-45}
    />
  );
};

export const DelaisTranchesChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useDelaisTranches(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].labels && data[0].values) {
    nivoData = data[0].labels.map((label: string, i: number) => ({
      id: label,
      value: data[0].values[i]
    }));
  } else if (Array.isArray(data)) {
    nivoData = data.map((d: any, i: number) => ({
      id: d._id,
      value: d.count,
      label: d._id
    }));
  }
  return (
    <NivoPieChart
      data={nivoData}
      height={350}
      colors={["#4CAF50", "#FF9800", "#F44336"]}
      margin={{ top: 40, right: 40, bottom: 50, left: 40 }}
      innerRadius={0.5}
      padAngle={0.7}
      cornerRadius={3}
      themeOverrides={{ fontSize: 16 }}
      legends={[
        {
          anchor: 'bottom',
          direction: 'row',
          justify: false,
          translateY: 36,
          itemWidth: 100,
          itemHeight: 18,
          itemsSpacing: 0,
          symbolSize: 18,
          symbolShape: 'circle',
        },
      ]}
    />
  );
};

export const Top5DelaisChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useTop5Delais(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].x && data[0].y) {
    nivoData = data[0].x.map((nom_ao: string, i: number) => ({
      nom_ao: `${nom_ao}-${i}`,
      delai_jours: data[0].y[i]
    }));
  } else if (Array.isArray(data)) {
    nivoData = data.map((d: any, i: number) => ({
      nom_ao: `${d.nom_ao}-${i}`,
      delai_jours: d.delai_jours
    }));
  }
  return (
    <NivoBarChart
      data={nivoData}
      keys={["delai_jours"]}
      indexBy="nom_ao"
      height={350}
      colors={["#9C27B0"]}
      axisBottomLegend="Appel d'Offres"
      axisLeftLegend="Délai (jours)"
      margin={{ top: 40, right: 40, bottom: 80, left: 60 }}
      legendLabel="Appel d'Offres"
      xAxisTickRotation={-45}
    />
  );
};

// Composants pour l'onglet Notes
export const NotesChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useNotesData(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].x && data[0].y) {
    nivoData = data[0].x.map((note: string, i: number) => ({
      note: `${note}-${i}`,
      count: data[0].y[i]
    }));
  } else if (Array.isArray(data)) {
    nivoData = data.map((d: any, i: number) => ({
      note: `${d._id}-${i}`,
      count: d.count
    }));
  }
  return (
    <NivoBarChart
      data={nivoData}
      keys={["count"]}
      indexBy="note"
      height={350}
      colors={["#4CAF50"]}
      axisBottomLegend="Note"
      axisLeftLegend="Nombre d'AO"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
      legendLabel="Note"
    />
  );
};

export const Top5NotesChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useTop5Data(filters, 'notes');
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].x && data[0].y) {
    // Format Plotly
    nivoData = data[0].x.map((label: string, i: number) => ({
      label: `${label}-${i}`,
      value: data[0].y[i]
    }));
  } else if (Array.isArray(data)) {
    // Format Nivo direct
    nivoData = data.map((d: any, i: number) => ({
      label: `${d.label || d.nom_ao || d._id}-${i}`,
      value: d.value || d.note_technique || d.count
    }));
  }
  return (
    <NivoBarChart
      data={nivoData}
      keys={["value"]}
      indexBy="label"
      height={350}
      colors={["#4CAF50"]}
      axisBottomLegend="AO"
      axisLeftLegend="Note technique"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
      legendLabel="AO"
      // layout="horizontal" // décommente si tu veux un bar horizontal
    />
  );
};

export const NotesTranchesChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useNotesTranches(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].x && data[0].y) {
    nivoData = data[0].x.map((tranche: string, i: number) => ({
      tranche: `${tranche}-${i}`,
      count: data[0].y[i]
    }));
  } else if (Array.isArray(data)) {
    nivoData = data.map((d: any, i: number) => ({
      tranche: `${d._id}-${i}`,
      count: d.count
    }));
  }
  return (
    <NivoBarChart
      data={nivoData}
      keys={["count"]}
      indexBy="tranche"
      height={350}
      colors={["#4CAF50"]}
      axisBottomLegend="Tranche de note"
      axisLeftLegend="Nombre d'AO"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
      legendLabel="Tranche"
    />
  );
};

export const NotesQualitativesChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useNotesQualitatives(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].x && data[0].y && data[0].y2) {
    // Format Plotly groupé
    nivoData = data[0].x.map((categorie: string, i: number) => ({
      categorie,
      "Note technique": data[0].y[i],
      "Note prix": data[0].y2[i]
    }));
  } else if (Array.isArray(data)) {
    nivoData = data.map((d: any) => ({
      categorie: d._id,
      "Note technique": d.note_technique_moyenne,
      "Note prix": d.note_prix_moyenne
    }));
  }
  return (
    <NivoBarChart
      data={nivoData}
      keys={["Note technique", "Note prix"]}
      indexBy="categorie"
      height={350}
      colors={["#00B050", "#4472C4"]}
      axisBottomLegend="Catégorie"
      axisLeftLegend="Note moyenne"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
      legendLabel="Type de note"
      groupMode="grouped"
    />
  );
};

export const NotesBoxChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useNotesBox(filters);
  let grouped: Record<string, number[]> = {};
  if (Array.isArray(data)) {
    data.forEach((d: any) => {
      if (d.note_technique != null && d.categorie) {
        if (!grouped[d.categorie]) grouped[d.categorie] = [];
        grouped[d.categorie].push(d.note_technique);
      }
    });
  }
  const nivoData = Object.entries(grouped).map(([categorie, values]) => ({
    id: categorie,
    group: categorie,
    values
  }));
  return (
    <NivoBoxPlot
      data={nivoData}
      height={350}
      colors={["#4472C4"]}
      axisBottomLegend="Catégorie"
      axisLeftLegend="Note technique"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
    />
  );
};

// Composants pour l'onglet Prix
export const PrixChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = usePrixData(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  const nivoData = data.map((d: any, i: number) => ({
    prix: `${d._id}-${i}`,
    note: d.note_technique
  }));
  return (
    <NivoBarChart
      data={nivoData}
      keys={["note"]}
      indexBy="prix"
      height={350}
      colors={["#FF9800"]}
      axisBottomLegend="Prix client"
      axisLeftLegend="Note technique"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
      legendLabel="Prix"
    />
  );
};

export const PrixTranchesChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = usePrixTranches(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  const nivoData = data.map((d: any, i: number) => ({
    tranche: `${d._id}-${i}`,
    count: d.count
  }));
  return (
    <NivoBarChart
      data={nivoData}
      keys={["count"]}
      indexBy="tranche"
      height={350}
      colors={["#FF9800"]}
      axisBottomLegend="Tranche de prix"
      axisLeftLegend="Nombre d'AO"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
      legendLabel="Tranche"
    />
  );
};

export const PositionnementPrixChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = usePositionnementPrix(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  const nivoData = data.map((d: any, i: number) => ({
    position: `${d._id}-${i}`,
    count: d.count
  }));
  // Couleurs dynamiques selon la position
  const colors = data.map((d: any) => {
    if (d._id === 'Trop cher') return '#F4B084';
    if (d._id === 'Trop bas') return '#002060';
    return '#00B050';
  });
  return (
    <NivoBarChart
      data={nivoData}
      keys={["count"]}
      indexBy="position"
      height={350}
      colors={colors}
      axisBottomLegend="Positionnement"
      axisLeftLegend="Nombre d'AO"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
      legendLabel="Position"
    />
  );
};

export const PrixBoxChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = usePrixBox(filters);
  // Correction : regrouper les prix par catégorie
  let grouped: Record<string, number[]> = {};
  if (Array.isArray(data)) {
    data.forEach((d: any) => {
      if (d.prix_client != null && d.categorie) {
        if (!grouped[d.categorie]) grouped[d.categorie] = [];
        grouped[d.categorie].push(d.prix_client);
      }
    });
  }
  const nivoData = Object.entries(grouped).map(([categorie, values]) => ({
    id: categorie,
    group: categorie,
    values
  }));
  return (
    <NivoBoxPlot
      data={nivoData}
      height={350}
      colors={["#FF9800"]}
      axisBottomLegend="Catégorie"
      axisLeftLegend="Prix (€)"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
    />
  );
};

export const TauxSuccesPrixChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useTauxSuccesPrix(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  const nivoData = data.map((d: any) => ({
    tranche: d._id,
    taux: d.taux_succes * 100
  }));
  return (
    <NivoBarChart
      data={nivoData}
      keys={["taux"]}
      indexBy="tranche"
      height={350}
      colors={["#00B050"]}
      axisBottomLegend="Tranche de prix"
      axisLeftLegend="Taux de succès (%)"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
      legendLabel="Tranche"
    />
  );
};

// Composants pour l'onglet Comparaison
export const ComparaisonChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useComparaisonData(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].x && data[0].y) {
    nivoData = [{
      id: 'Comparaison',
      data: data[0].x.map((x: number, i: number) => ({ x, y: data[0].y[i] }))
    }];
  } else if (Array.isArray(data)) {
    nivoData = [{
      id: 'Comparaison',
      data: data.map((d: any) => ({ x: d.score_client, y: d.score_gagnant }))
    }];
  }
  return (
    <NivoScatterPlot
      data={nivoData}
      height={350}
      colors={["#D32F2F"]}
      axisBottomLegend="Score client"
      axisLeftLegend="Score gagnant"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
    />
  );
};

export const Top5EcartsFaiblesChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useTop5EcartsFaibles(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].y && data[0].x) {
    nivoData = data[0].y.map((nom_ao: string, i: number) => ({
      nom_ao: nom_ao ? `${nom_ao}-${i}` : `AO-${i}`,
      ecart: typeof data[0].x[i] === 'number' ? data[0].x[i] : 0
    }));
  } else if (Array.isArray(data)) {
    nivoData = data.map((d: any, i: number) => ({
      nom_ao: (d.nom_ao ? `${d.nom_ao}-${i}` : `AO-${i}`),
      ecart: typeof d.ecart_score === 'number' ? d.ecart_score : 0
    }));
  }
  if (!nivoData.length || !nivoData[0].nom_ao || typeof nivoData[0].ecart !== 'number') {
    return <div className="error">Erreur de mapping des données pour Nivo (Top5EcartsFaiblesChart)</div>;
  }
  return (
    <NivoBarChart
      data={nivoData}
      keys={["ecart"]}
      indexBy="nom_ao"
      height={350}
      colors={["#70AD47"]}
      axisBottomLegend="Écart de score (points)"
      axisLeftLegend="Appel d'Offres"
      margin={{ top: 40, right: 40, bottom: 50, left: 120 }}
      legendLabel="Appel d'Offres"
      layout="horizontal"
    />
  );
};

export const Top5EcartsChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useTop5Data(filters, 'ecarts');
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].x && data[0].y) {
    nivoData = data[0].x.map((label: string, i: number) => ({
      label: label ? `${label}-${i}` : `AO-${i}`,
      value: typeof data[0].y[i] === 'number' ? data[0].y[i] : 0
    }));
  } else if (Array.isArray(data)) {
    nivoData = data.map((d: any, i: number) => ({
      label: (d.label || d.nom_ao || d._id) ? `${d.label || d.nom_ao || d._id}-${i}` : `AO-${i}`,
      value: typeof (d.value ?? d.ecart_score ?? d.count) === 'number' ? (d.value ?? d.ecart_score ?? d.count) : 0
    }));
  }
  if (!nivoData.length || !nivoData[0].label || typeof nivoData[0].value !== 'number') {
    return <div className="error">Erreur de mapping des données pour Nivo (Top5EcartsChart)</div>;
  }
  return (
    <NivoBarChart
      data={nivoData}
      keys={["value"]}
      indexBy="label"
      height={350}
      colors={["#D32F2F"]}
      axisBottomLegend="AO"
      axisLeftLegend="Écart de score"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
      legendLabel="AO"
    />
  );
};

export const EcartsCategorieChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useEcartsCategorie(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].x && data[0].y) {
    nivoData = data[0].x.map((categorie: string, i: number) => ({
      categorie: categorie ? `${categorie}-${i}` : `Cat-${i}`,
      ecart: typeof data[0].y[i] === 'number' ? data[0].y[i] : 0
    }));
  } else if (Array.isArray(data)) {
    nivoData = data.map((d: any, i: number) => ({
      categorie: (d._id ? `${d._id}-${i}` : `Cat-${i}`),
      ecart: typeof d.ecart_moyen === 'number' ? d.ecart_moyen : 0
    }));
  }
  if (!nivoData.length || !nivoData[0].categorie || typeof nivoData[0].ecart !== 'number') {
    return <div className="error">Erreur de mapping des données pour Nivo (EcartsCategorieChart)</div>;
  }
  return (
    <NivoBarChart
      data={nivoData}
      keys={["ecart"]}
      indexBy="categorie"
      height={350}
      colors={["#4472C4"]}
      axisBottomLegend="Catégorie"
      axisLeftLegend="Écart moyen (points)"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
      legendLabel="Catégorie"
    />
  );
};

export const EcartsTranchesChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useEcartsTranches(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].x && data[0].y) {
    nivoData = data[0].x.map((tranche: string, i: number) => ({
      tranche: tranche ? `${tranche}-${i}` : `Tranche-${i}`,
      count: typeof data[0].y[i] === 'number' ? data[0].y[i] : 0
    }));
  } else if (Array.isArray(data)) {
    nivoData = data.map((d: any, i: number) => ({
      tranche: (d._id ? `${d._id}-${i}` : `Tranche-${i}`),
      count: typeof d.count === 'number' ? d.count : 0
    }));
  }
  if (!nivoData.length || !nivoData[0].tranche || typeof nivoData[0].count !== 'number') {
    return <div className="error">Erreur de mapping des données pour Nivo (EcartsTranchesChart)</div>;
  }
  return (
    <NivoBarChart
      data={nivoData}
      keys={["count"]}
      indexBy="tranche"
      height={350}
      colors={["#9C27B0"]}
      axisBottomLegend="Tranche d'écart"
      axisLeftLegend="Nombre d'AO"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
      legendLabel="Tranche"
    />
  );
};

export const EcartsBoxChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useEcartsBox(filters);
  let grouped: Record<string, number[]> = {};
  if (Array.isArray(data)) {
    data.forEach((d: any) => {
      if (d.ecart_score != null && d.categorie) {
        if (!grouped[d.categorie]) grouped[d.categorie] = [];
        grouped[d.categorie].push(typeof d.ecart_score === 'number' ? d.ecart_score : 0);
      }
    });
  }
  const nivoData = Object.entries(grouped).map(([categorie, values]) => ({
    id: categorie,
    group: categorie,
    values
  }));
  if (!nivoData.length || !nivoData[0].id || !Array.isArray(nivoData[0].values)) {
    return <div className="error">Erreur de mapping des données pour Nivo (EcartsBoxChart)</div>;
  }
  return (
    <NivoBoxPlot
      data={nivoData}
      height={350}
      colors={["#4472C4"]}
      axisBottomLegend="Catégorie"
      axisLeftLegend="Écart de score (points)"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
    />
  );
};

export const Top5EcartsFortsChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = useTop5EcartsForts(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  let nivoData: any[] = [];
  if (Array.isArray(data) && data.length && data[0].y && data[0].x) {
    nivoData = data[0].y.map((nom_ao: string, i: number) => ({
      nom_ao: nom_ao ? `${nom_ao}-${i}` : `AO-${i}`,
      ecart: typeof data[0].x[i] === 'number' ? data[0].x[i] : 0
    }));
  } else if (Array.isArray(data)) {
    nivoData = data.map((d: any, i: number) => ({
      nom_ao: (d.nom_ao ? `${d.nom_ao}-${i}` : `AO-${i}`),
      ecart: typeof d.ecart_score === 'number' ? d.ecart_score : 0
    }));
  }
  if (!nivoData.length || !nivoData[0].nom_ao || typeof nivoData[0].ecart !== 'number') {
    return <div className="error">Erreur de mapping des données pour Nivo (Top5EcartsFortsChart)</div>;
  }
  return (
    <NivoBarChart
      data={nivoData}
      keys={["ecart"]}
      indexBy="nom_ao"
      height={350}
      colors={["#D32F2F"]}
      axisBottomLegend="Écart de score (points)"
      axisLeftLegend="Appel d'Offres"
      margin={{ top: 40, right: 40, bottom: 50, left: 120 }}
      legendLabel="Appel d'Offres"
      layout="horizontal"
    />
  );
};

// Composant principal
const BibliothequeGraphiquePage: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedDashboard,
    setSelectedDashboard,
    addedGraphs,
    loading,
    error,
    dashboards,
    filters,
    filterOptions,
    filterOptionsLoading,
    filterOptionsError,
    handleFilterChange,
    resetFilters,
    addGraphToDashboard,
    removeGraphFromDashboard,
  } = useGraphLibrary();

  const biblioTabs: TabItem[] = [
    { label: 'Bibliothèque de Graphiques', to: '/visualisation/bibliotheque-graphique' },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Tabs tabs={biblioTabs} />
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 dark:bg-dark-backgroundSecondary">
        <h1 className="text-2xl font-title font-bold mb-6 text-primary dark:text-dark-primary">Bibliothèque de Graphiques</h1>
        {/* Section des filtres en haut */}
        <div className="bg-backgroundSecondary rounded-xl p-6 mb-8 border border-border shadow">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
            <h3 className="font-title text-lg font-semibold text-textSecondary m-0">Filtres</h3>
            <button className="bg-primary text-white rounded-lg px-6 py-3 font-body text-sm font-medium transition hover:bg-hover hover:text-text shadow" onClick={resetFilters}>
              Réinitialiser
            </button>
          </div>
          
          <div className="filters-grid">
            {/* Dashboard Selector */}
            <div className="filter-group dashboard-selector">
              <label>Dashboard</label>
              <select 
                value={selectedDashboard} 
                onChange={(e) => setSelectedDashboard(e.target.value)}
                disabled={loading}
              >
                <option value="">Sélectionner un dashboard</option>
                {dashboards.map(d => (
                  <option key={d.id} value={d.id}>{d.nom}</option>
                ))}
              </select>
            </div>

            {/* Catégories */}
            <div className="filter-group">
              <label>Catégories</label>
              <div className="checkbox-group">
                {filterOptionsLoading ? (
                  <div style={{ padding: '0.5rem', color: '#4A635D', fontSize: '12px' }}>Chargement...</div>
                ) : filterOptionsError ? (
                  <div style={{ padding: '0.5rem', color: '#D32F2F', fontSize: '12px' }}>Erreur: {filterOptionsError}</div>
                ) : (
                  filterOptions.categories.map(category => (
                    <label key={category} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={(e) => {
                          const newCategories = e.target.checked
                            ? [...filters.categories, category]
                            : filters.categories.filter(c => c !== category);
                          handleFilterChange('categories', newCategories);
                        }}
                      />
                      <span>{category}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Statuts */}
            <div className="filter-group">
              <label>Statuts</label>
              <div className="checkbox-group">
                {filterOptionsLoading ? (
                  <div style={{ padding: '0.5rem', color: '#4A635D', fontSize: '12px' }}>Chargement...</div>
                ) : filterOptionsError ? (
                  <div style={{ padding: '0.5rem', color: '#D32F2F', fontSize: '12px' }}>Erreur: {filterOptionsError}</div>
                ) : (
                  filterOptions.statuts.map(status => (
                    <label key={status} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={filters.statuts.includes(status)}
                        onChange={(e) => {
                          const newStatuts = e.target.checked
                            ? [...filters.statuts, status]
                            : filters.statuts.filter(s => s !== status);
                          handleFilterChange('statuts', newStatuts);
                        }}
                      />
                      <span>{status}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Pôles */}
            <div className="filter-group">
              <label>Pôles</label>
              <div className="checkbox-group">
                {filterOptionsLoading ? (
                  <div style={{ padding: '0.5rem', color: '#4A635D', fontSize: '12px' }}>Chargement...</div>
                ) : filterOptionsError ? (
                  <div style={{ padding: '0.5rem', color: '#D32F2F', fontSize: '12px' }}>Erreur: {filterOptionsError}</div>
                ) : (
                  filterOptions.poles.map(pole => (
                    <label key={pole} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={filters.poles.includes(pole)}
                        onChange={(e) => {
                          const newPoles = e.target.checked
                            ? [...filters.poles, pole]
                            : filters.poles.filter(p => p !== pole);
                          handleFilterChange('poles', newPoles);
                        }}
                      />
                      <span>{pole}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="filter-group">
              <label>Période</label>
              <div className="date-inputs">
                <input
                  type="date"
                  className="date-input"
                  value={filters.dateDebut}
                  onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                />
                <span>à</span>
                <input
                  type="date"
                  className="date-input"
                  value={filters.dateFin}
                  onChange={(e) => handleFilterChange('dateFin', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-transparent rounded-none p-0 shadow-none border-none">
          {error && <div className="text-error bg-red-50 border border-red-200 rounded-lg p-4 text-center font-body text-sm font-medium mb-4">{error}</div>}
          {/* Onglets */}
          <div className="flex bg-backgroundSecondary rounded-xl p-2 mb-8 shadow border border-border gap-2 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`bg-transparent border-none px-6 py-4 rounded-lg cursor-pointer transition font-body text-sm font-medium whitespace-nowrap flex items-center gap-2 min-w-fit ${activeTab === tab.id ? 'bg-primary text-white shadow font-bold' : 'text-textSecondary hover:bg-hover hover:text-text'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
          {/* Contenu des onglets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-0">
            {activeTab === "gagne-perdu" && (
              <>
                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("gagne-perdu-pie", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Répartition Gagné/Perdu</h3>
                  </div>
                  <div className="graph-content">
                    <GagnePerduChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("gagne-perdu-pie", "Répartition Gagné/Perdu")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("gagne-perdu-pie")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("gagne-perdu-categorie", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Répartition par Catégorie</h3>
                  </div>
                  <div className="graph-content">
                    <CategorieChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("gagne-perdu-categorie", "Répartition par Catégorie")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("gagne-perdu-categorie")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("gagne-perdu-pole", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Répartition par Pôle</h3>
                  </div>
                  <div className="graph-content">
                    <PoleChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("gagne-perdu-pole", "Répartition par Pôle")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("gagne-perdu-pole")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card large">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("gagne-perdu-evolution-mois", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Évolution du taux de succès par mois</h3>
                  </div>
                  <div className="graph-content">
                    <GagnePerduEvolutionMoisChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("gagne-perdu-evolution-mois", "Évolution du taux de succès par mois")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("gagne-perdu-evolution-mois")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("gagne-perdu-taux-succes-categorie", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Taux de succès par catégorie</h3>
                  </div>
                  <div className="graph-content">
                    <GagnePerduTauxSuccesCategorieChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("gagne-perdu-taux-succes-categorie", "Taux de succès par catégorie")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("gagne-perdu-taux-succes-categorie")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("gagne-perdu-taux-succes-pole", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Taux de succès par pôle</h3>
                  </div>
                  <div className="graph-content">
                    <GagnePerduTauxSuccesPoleChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("gagne-perdu-taux-succes-pole", "Taux de succès par pôle")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("gagne-perdu-taux-succes-pole")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "delais" && (
              <>
                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("delais-categorie", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Délais par Catégorie</h3>
                  </div>
                  <div className="graph-content">
                    <DelaisChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("delais-categorie", "Délais par Catégorie")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("delais-categorie")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("delais-stats", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Délais moyens par Catégorie</h3>
                  </div>
                  <div className="graph-content">
                    <DelaisStatsChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("delais-stats", "Délais moyens par Catégorie")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("delais-stats")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card large">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("delais-par-ao", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Délais par Appel d'Offres</h3>
                  </div>
                  <div className="graph-content">
                    <DelaisParAOChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("delais-par-ao", "Délais par Appel d'Offres")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("delais-par-ao")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("delais-tranches", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Répartition par Tranches de Délais</h3>
                  </div>
                  <div className="graph-content">
                    <DelaisTranchesChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("delais-tranches", "Répartition par Tranches de Délais")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("delais-tranches")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("top5-delais", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Top 5 - Délais les plus longs</h3>
                  </div>
                  <div className="graph-content">
                    <Top5DelaisChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("top5-delais", "Top 5 - Délais les plus longs")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("top5-delais")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "notes" && (
              <>
                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("notes-distribution", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Distribution des Notes</h3>
                  </div>
                  <div className="graph-content">
                    <NotesChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("notes-distribution", "Distribution des Notes")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("notes-distribution")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("top5-notes", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Top 5 - Meilleures Notes</h3>
                  </div>
                  <div className="graph-content">
                    <Top5NotesChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("top5-notes", "Top 5 - Meilleures Notes")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("top5-notes")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("notes-tranches", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Répartition par Tranches de Notes</h3>
                  </div>
                  <div className="graph-content">
                    <NotesTranchesChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("notes-tranches", "Répartition par Tranches de Notes")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("notes-tranches")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("notes-qualitatives", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Notes Techniques vs Prix par Catégorie</h3>
                  </div>
                  <div className="graph-content">
                    <NotesQualitativesChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("notes-qualitatives", "Notes Techniques vs Prix par Catégorie")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("notes-qualitatives")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("notes-box", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Distribution des Notes Techniques</h3>
                  </div>
                  <div className="graph-content">
                    <NotesBoxChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("notes-box", "Distribution des Notes Techniques")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("notes-box")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "prix" && (
              <>
                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("prix-vs-notes", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Prix vs Notes Techniques</h3>
                  </div>
                  <div className="graph-content">
                    <PrixChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("prix-vs-notes", "Prix vs Notes Techniques")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("prix-vs-notes")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("prix-tranches", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Répartition par Tranches de Prix</h3>
                  </div>
                  <div className="graph-content">
                    <PrixTranchesChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("prix-tranches", "Répartition par Tranches de Prix")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("prix-tranches")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("positionnement-prix", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Positionnement des Prix</h3>
                  </div>
                  <div className="graph-content">
                    <PositionnementPrixChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("positionnement-prix", "Positionnement des Prix")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("positionnement-prix")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("prix-box", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Distribution des Prix par Catégorie</h3>
                  </div>
                  <div className="graph-content">
                    <PrixBoxChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("prix-box", "Distribution des Prix par Catégorie")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("prix-box")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("taux-succes-prix", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Taux de Succès par Tranche de Prix</h3>
                  </div>
                  <div className="graph-content">
                    <TauxSuccesPrixChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("taux-succes-prix", "Taux de Succès par Tranche de Prix")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("taux-succes-prix")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "comparaison" && (
              <>
                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("comparaison-scores", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Score Client vs Score Gagnant</h3>
                  </div>
                  <div className="graph-content">
                    <ComparaisonChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("comparaison-scores", "Score Client vs Score Gagnant")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("comparaison-scores")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("top5-ecarts", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Top 5 - Plus gros Écarts</h3>
                  </div>
                  <div className="graph-content">
                    <Top5EcartsChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("top5-ecarts", "Top 5 - Plus gros Écarts")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("top5-ecarts")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("ecarts-categorie", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Écarts de Score par Catégorie</h3>
                  </div>
                  <div className="graph-content">
                    <EcartsCategorieChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("ecarts-categorie", "Écarts de Score par Catégorie")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("ecarts-categorie")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("ecarts-tranches", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Répartition par Tranches d'Écarts</h3>
                  </div>
                  <div className="graph-content">
                    <EcartsTranchesChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("ecarts-tranches", "Répartition par Tranches d'Écarts")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("ecarts-tranches")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("ecarts-box", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Distribution des Écarts par Catégorie</h3>
                  </div>
                  <div className="graph-content">
                    <EcartsBoxChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("ecarts-box", "Distribution des Écarts par Catégorie")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("ecarts-box")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("top5-ecarts-faibles", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Top 5 - Écarts les plus Faibles</h3>
                  </div>
                  <div className="graph-content">
                    <Top5EcartsFaiblesChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("top5-ecarts-faibles", "Top 5 - Écarts les plus Faibles")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("top5-ecarts-faibles")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>

                <div className="graph-card medium">
                  <DashboardIndicator isInDashboard={isGraphInDashboard("top5-ecarts-forts", addedGraphs, selectedDashboard)} />
                  <div className="graph-header">
                    <h3 className="graph-title">Top 5 - Écarts les plus Forts</h3>
                  </div>
                  <div className="graph-content">
                    <Top5EcartsFortsChart filters={filters} />
                  </div>
                  <div className="graph-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => addGraphToDashboard("top5-ecarts-forts", "Top 5 - Écarts les plus Forts")}
                      disabled={loading || !selectedDashboard}
                    >
                      Ajouter au Dashboard
                    </button>
                    <button 
                      className="action-btn remove"
                      onClick={() => removeGraphFromDashboard("top5-ecarts-forts")}
                      disabled={loading || !selectedDashboard}
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BibliothequeGraphiquePage;

// Exports pour MesTableauxBordsPage.tsx
export const delaiTableColumns = [
  { key: 'ao', label: "Appel d'Offres" },
  { key: 'categorie', label: 'Catégorie' },
  { key: 'delai', label: 'Délai (jours)' },
  { key: 'statut', label: 'Statut' }
];

export const delaiTableData = [
  { ao: 'AO 1', categorie: 'Bâtiment', delai: 10, statut: 'Terminé' },
  { ao: 'AO 2', categorie: 'Informatique', delai: 15, statut: 'En cours' },
  { ao: 'AO 3', categorie: 'Services', delai: 7, statut: 'Terminé' },
  { ao: 'AO 4', categorie: 'Transport', delai: 12, statut: 'En cours' },
  { ao: 'AO 5', categorie: 'Bâtiment', delai: 18, statut: 'Terminé' }
];

export const notesTableColumns = [
  { key: 'ao', label: "Appel d'Offres" },
  { key: 'categorie', label: 'Catégorie' },
  { key: 'note_technique', label: 'Note Technique' },
  { key: 'note_prix', label: 'Note Prix' },
  { key: 'note_totale', label: 'Note Totale' }
];

export const notesTableData = [
  { ao: 'AO 1', categorie: 'Bâtiment', note_technique: 12, note_prix: 8, note_totale: 20 },
  { ao: 'AO 2', categorie: 'Informatique', note_technique: 15, note_prix: 10, note_totale: 25 },
  { ao: 'AO 3', categorie: 'Services', note_technique: 16, note_prix: 9, note_totale: 25 },
  { ao: 'AO 4', categorie: 'Transport', note_technique: 14, note_prix: 11, note_totale: 25 },
  { ao: 'AO 5', categorie: 'Bâtiment', note_technique: 13, note_prix: 7, note_totale: 20 }
];

export const prixTableColumns = [
  { key: 'ao', label: "Appel d'Offres" },
  { key: 'categorie', label: 'Catégorie' },
  { key: 'prix_client', label: 'Prix Client (€)' },
  { key: 'prix_gagnant', label: 'Prix Gagnant (€)' },
  { key: 'ecart_prix', label: 'Écart Prix (%)' }
];

export const prixTableData = [
  { ao: 'AO 1', categorie: 'Bâtiment', prix_client: 50000, prix_gagnant: 48000, ecart_prix: 4.0 },
  { ao: 'AO 2', categorie: 'Informatique', prix_client: 75000, prix_gagnant: 72000, ecart_prix: 4.0 },
  { ao: 'AO 3', categorie: 'Services', prix_client: 30000, prix_gagnant: 28500, ecart_prix: 5.0 },
  { ao: 'AO 4', categorie: 'Transport', prix_client: 45000, prix_gagnant: 43200, ecart_prix: 4.0 },
  { ao: 'AO 5', categorie: 'Bâtiment', prix_client: 60000, prix_gagnant: 57000, ecart_prix: 5.0 }
];

export const ecartTableColumns = [
  { key: 'ao', label: "Appel d'Offres" },
  { key: 'categorie', label: 'Catégorie' },
  { key: 'score_client', label: 'Score Client' },
  { key: 'score_gagnant', label: 'Score Gagnant' },
  { key: 'ecart_score', label: 'Écart Score' }
];

export const ecartTableData = [
  { ao: 'AO 1', categorie: 'Bâtiment', score_client: 20, score_gagnant: 22, ecart_score: -2 },
  { ao: 'AO 2', categorie: 'Informatique', score_client: 25, score_gagnant: 26, ecart_score: -1 },
  { ao: 'AO 3', categorie: 'Services', score_client: 25, score_gagnant: 27, ecart_score: -2 },
  { ao: 'AO 4', categorie: 'Transport', score_client: 25, score_gagnant: 24, ecart_score: 1 },
  { ao: 'AO 5', categorie: 'Bâtiment', score_client: 20, score_gagnant: 21, ecart_score: -1 }
]; 

// Composant scatter plot pour Prix vs Notes Techniques
export const PrixVsNotesChart: React.FC<{ filters: FilterState }> = ({ filters }) => {
  const { data, loading, error } = usePrixData(filters);
  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!data || data.length === 0) return <div className="no-data">Aucune donnée disponible</div>;
  // Format pour NivoScatterPlot : [{ id, data: [{ x, y }, ...] }]
  const scatterData = [
    {
      id: 'Prix vs Notes',
      data: data.map((d: any) => ({ x: d._id, y: d.note_technique }))
    }
  ];
  return (
    <NivoScatterPlot
      data={scatterData}
      height={350}
      colors={["#2196F3"]}
      axisBottomLegend="Prix client"
      axisLeftLegend="Note technique"
      margin={{ top: 40, right: 40, bottom: 50, left: 60 }}
    />
  );
}; 