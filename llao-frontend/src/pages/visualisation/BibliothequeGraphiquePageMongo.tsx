import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './BibliothequeGraphiquePage.css';
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
  FilterState 
} from '../../hooks/useGraphData';
import NivoPieChart from '../../components/NivoPieChart';
import NivoBarChart from '../../components/NivoBarChart';
import NivoScatterPlot from '../../components/NivoScatterPlot';
import {
  GagnePerduChart,
  CategorieChart,
  PoleChart,
  DelaisChart,
  NotesChart,
  PrixChart,
  ComparaisonChart,
  Top5NotesChart,
  Top5EcartsChart
} from './BibliothequeGraphiquePage';
import { graphComponentMap } from './MesTableauxBordsPage';
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
  { id: "gagne-perdu", label: "Analyse Gagné/Perdu", icon: "📊" },
  { id: "delais", label: "Analyse des Délais", icon: "⏱️" },
  { id: "notes", label: "Analyse des Notes", icon: "⭐" },
  { id: "prix", label: "Analyse des Prix", icon: "💰" },
  { id: "comparaison", label: "Comparaison avec gagnant AO", icon: "📈" },
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

  // Options de filtres
  const filterOptions = useMemo(() => ({
    categories: ["Bâtiment", "Informatique", "Services", "Transport"],
    statuts: ["Gagné", "Perdu", "In progress"],
    poles: ["Pôle A", "Pôle B", "Pôle C"],
  }), []);

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
        if (!res.ok) {
          const text = await res.text();
          console.error("Réponse API (loadDashboardGraphs):", text);
          throw new Error("Erreur API");
        }
        const data = await res.json();
        setAddedGraphs(new Set(data.graphiques?.map((g: any) => g.graph_id)));
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
    handleFilterChange,
    resetFilters,
    addGraphToDashboard,
    removeGraphFromDashboard,
    setFilters, // <-- Ajout ici
  };
};

// Ajout des tables de correspondance pour sizing
const sizeToWidth: Record<string, number> = {
  small: 600,
  medium: 900,
  large: 1200,
};
const heightToPx: Record<string, number> = {
  small: 400,
  medium: 600,
  large: 900,
};

const biblioMongoTabs: TabItem[] = [
  { label: 'Bibliothèque Graphique Mongo', to: '/visualisation/bibliotheque-graphique-mongo' },
];

// Composant principal
const BibliothequeGraphiquePageMongo: React.FC = () => {
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
    handleFilterChange,
    resetFilters,
    addGraphToDashboard,
    removeGraphFromDashboard,
    setFilters // <-- Ajout ici
  } = useGraphLibrary();

  // Charger les options de filtres depuis MongoDB
  const { options: mongoFilterOptions, loading: filterOptionsLoading } = useFilterOptions();

  // Utiliser les options MongoDB si disponibles, sinon les options par défaut
  const finalFilterOptions = filterOptionsLoading ? filterOptions : mongoFilterOptions;

  // 1. Initialiser les filtres à des tableaux vides par défaut
  useEffect(() => {
    if (!filterOptionsLoading && finalFilterOptions && finalFilterOptions.categories && finalFilterOptions.statuts && finalFilterOptions.poles) {
      setFilters((prev: FilterState) => {
        // Si déjà initialisé, ne rien faire
        if (
          prev.categories.length === finalFilterOptions.categories.length &&
          prev.statuts.length === finalFilterOptions.statuts.length &&
          prev.poles.length === finalFilterOptions.poles.length
        ) {
          return prev;
        }
        return {
          ...prev,
          categories: finalFilterOptions.categories,
          statuts: finalFilterOptions.statuts,
          poles: finalFilterOptions.poles,
        };
      });
    }
  }, [filterOptionsLoading, finalFilterOptions, setFilters]);

  const FilterSection = () => (
    <div className="filter-section">
      <h3>Filtres</h3>
      <div className="filter-grid">
        <div className="filter-group">
          <label>Catégories:</label>
          <button type="button" onClick={() => handleFilterChange('categories', finalFilterOptions.categories)} style={{marginBottom: 4}}>Tout sélectionner</button>
          <select
            multiple
            value={filters.categories}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              handleFilterChange('categories', selected);
            }}
          >
            {finalFilterOptions.categories.map((c: string) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Statuts:</label>
          <button type="button" onClick={() => handleFilterChange('statuts', finalFilterOptions.statuts)} style={{marginBottom: 4}}>Tout sélectionner</button>
          <select
            multiple
            value={filters.statuts}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              handleFilterChange('statuts', selected);
            }}
          >
            {finalFilterOptions.statuts.map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Pôles:</label>
          <button type="button" onClick={() => handleFilterChange('poles', finalFilterOptions.poles)} style={{marginBottom: 4}}>Tout sélectionner</button>
          <select
            multiple
            value={filters.poles}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              handleFilterChange('poles', selected);
            }}
          >
            {finalFilterOptions.poles.map((p: string) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Date début:</label>
          <input
            type="date"
            value={filters.dateDebut}
            onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <label>Date fin:</label>
          <input
            type="date"
            value={filters.dateFin}
            onChange={(e) => handleFilterChange('dateFin', e.target.value)}
          />
        </div>
      </div>
      
      <button onClick={resetFilters} className="reset-filters-btn">
        Réinitialiser les filtres
      </button>
    </div>
  );

  const DashboardSelector = () => (
    <div className="dashboard-selector">
      <label>Dashboard:</label>
      <select
        value={selectedDashboard}
        onChange={(e) => setSelectedDashboard(e.target.value)}
      >
        {dashboards.map(d => (
          <option key={d.id} value={d.id}>{d.nom}</option>
        ))}
      </select>
    </div>
  );

  const GraphCard = ({ chart }: { chart: GraphChart }) => {
    const isAdded = addedGraphs.has(chart.id);
    const height = heightToPx[chart.size || 'medium'];
    // Les composants Nivo utilisent déjà la prop height, inutile de passer width
    let plotWithSize = chart.plot;
    // Pas de cloneElement pour width/height, les composants Nivo gèrent height
    return (
      <div className="graph-card">
        <h3>{chart.title}</h3>
        <p>{chart.description}</p>
        <div className="graph-container">
          {plotWithSize}
        </div>
        <div className="graph-actions">
          {isAdded ? (
            <button
              onClick={() => removeGraphFromDashboard(chart.id)}
              disabled={loading}
              className="remove-btn"
            >
              Retirer du dashboard
            </button>
          ) : (
            <button
              onClick={() => addGraphToDashboard(chart.id, chart.title)}
              disabled={loading || !selectedDashboard}
              className="add-btn"
            >
              Ajouter au dashboard
            </button>
          )}
        </div>
      </div>
    );
  };

  // Remplacer getGraphsForTab par une génération basée sur graphComponentMap
  const getAllGraphs = (): GraphChart[] => {
    return Object.entries(graphComponentMap).map(([graphId, GraphComponent]) => ({
      id: graphId,
      title: graphId,
      description: '',
      category: '',
      plot: React.createElement(GraphComponent, { filters }),
      size: 'medium',
    }));
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Tabs tabs={biblioMongoTabs} />
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 dark:bg-dark-backgroundSecondary">
        <h1 className="text-2xl font-title font-bold mb-6 text-primary dark:text-dark-primary">Bibliothèque Graphique Mongo</h1>
        {error && <div className="text-error bg-red-50 border border-red-200 rounded-lg p-4 text-center font-body text-sm font-medium mb-4">{error}</div>}
        <div className="flex gap-2 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`bg-transparent border-none px-6 py-4 rounded-lg cursor-pointer transition font-body text-sm font-medium whitespace-nowrap flex items-center gap-2 min-w-fit ${activeTab === tab.id ? 'bg-primary text-white shadow font-bold' : 'text-textSecondary hover:bg-hover hover:text-text'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="font-medium">{tab.icon} {tab.label}</span>
            </button>
          ))}
        </div>
        <FilterSection />
        <DashboardSelector />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {getAllGraphs().map(graph => (
            <GraphCard key={graph.id} chart={graph} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BibliothequeGraphiquePageMongo; 