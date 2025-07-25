import { useState, useEffect } from 'react';
import { dataService, FilterState } from '../services/dataService';

// Ré-exporter FilterState pour l'utiliser dans d'autres fichiers
export type { FilterState };

// Hook pour les données gagné/perdu
export const useGagnePerduData = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const stats = await dataService.getStatsGagnePerdu(filters);
        
        // Transformer pour Plotly
        const plotlyData = [{
          values: stats.map(s => s.count),
          labels: stats.map(s => s._id),
          type: 'pie' as const,
          marker: { colors: ['#00B050', '#D32F2F', '#F4B084'] },
          textinfo: 'label+percent' as const
        }];
        
        setData(plotlyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

// Hook pour les données par catégorie
export const useCategorieData = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const stats = await dataService.getStatsParCategorie(filters);
        
        // Transformer pour Plotly bar chart
        const categories = [...new Set(stats.map(s => s._id.categorie))];
        const statuts = [...new Set(stats.map(s => s._id.statut))];
        
        const plotlyData = statuts.map((statut, i) => ({
          x: categories,
          y: categories.map(cat => {
            const found = stats.find(s => s._id.categorie === cat && s._id.statut === statut);
            return found ? found.count : 0;
          }),
          name: statut,
          type: 'bar' as const,
          marker: { color: ['#00B050', '#D32F2F', '#F4B084'][i] }
        }));
        
        setData(plotlyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

// Hook pour les données par pôle
export const usePoleData = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const stats = await dataService.getStatsParPole(filters);
        
        // Transformer pour Plotly bar chart
        const poles = [...new Set(stats.map(s => s._id.pole))];
        const statuts = [...new Set(stats.map(s => s._id.statut))];
        
        const plotlyData = statuts.map((statut, i) => ({
          x: poles,
          y: poles.map(pole => {
            const found = stats.find(s => s._id.pole === pole && s._id.statut === statut);
            return found ? found.count : 0;
          }),
          name: statut,
          type: 'bar' as const,
          marker: { color: ['#00B050', '#D32F2F', '#F4B084'][i] }
        }));
        
        setData(plotlyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

// Hook pour les données de délais
export const useDelaisData = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const stats = await dataService.getStatsDelais(filters);
        
        // Transformer pour Plotly bar chart
        const plotlyData = [{
          x: stats.map(s => s._id),
          y: stats.map(s => s.delai_moyen),
          type: 'bar' as const,
          marker: { color: '#4472C4' }
        }];
        
        setData(plotlyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

// Hook pour les données de notes
export const useNotesData = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const stats = await dataService.getStatsNotes(filters);
        
        // Transformer pour Plotly box plot
        const aoData = await dataService.getAOData(filters);
        const plotlyData = [{
          y: aoData.map(ao => ao.note_technique),
          x: aoData.map(ao => ao.categorie),
          type: 'box' as const,
          name: 'Note technique',
          marker: { color: '#4472C4' }
        }];
        
        setData(plotlyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

// Hook pour les données de prix
export const usePrixData = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const aoData = await dataService.getAOData(filters);
        
        // Transformer pour Plotly scatter plot
        const plotlyData = [{
          x: aoData.map(ao => ao.prix_client),
          y: aoData.map(ao => ao.note_technique),
          mode: 'markers' as const,
          type: 'scatter' as const,
          marker: { 
            color: aoData.map(ao => ao.statut === 'Gagné' ? '#00B050' : '#D32F2F'),
            size: 10
          },
          text: aoData.map(ao => ao.nom_ao),
          hovertemplate: '<b>%{text}</b><br>Prix: %{x}<br>Note: %{y}<extra></extra>'
        }];
        
        setData(plotlyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

// Hook pour les données de comparaison
export const useComparaisonData = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const aoData = await dataService.getAOData(filters);
        
        // Transformer pour Plotly scatter plot
        const plotlyData = [{
          x: aoData.map(ao => ao.score_client),
          y: aoData.map(ao => ao.score_gagnant),
          mode: 'markers' as const,
          type: 'scatter' as const,
          marker: { 
            color: aoData.map(ao => ao.statut === 'Gagné' ? '#00B050' : '#D32F2F'),
            size: 10
          },
          text: aoData.map(ao => ao.nom_ao),
          hovertemplate: '<b>%{text}</b><br>Score client: %{x}<br>Score gagnant: %{y}<extra></extra>'
        }];
        
        setData(plotlyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

// Hook pour les top 5
export const useTop5Data = (filters: FilterState, type: 'notes' | 'ecarts') => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const top5Data = type === 'notes' 
          ? await dataService.getTop5Notes(filters)
          : await dataService.getTop5Ecarts(filters);
        
        // Transformer pour Plotly bar chart
        const plotlyData = [{
          x: top5Data.map(item => item.nom_ao),
          y: top5Data.map(item => type === 'notes' ? item.note_technique : item.ecart_score),
          type: 'bar' as const,
          marker: { color: type === 'notes' ? '#00B050' : '#D32F2F' }
        }];
        
        setData(plotlyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, type]);

  return { data, loading, error };
};

// Hook pour les options de filtres
export const useFilterOptions = () => {
  const [options, setOptions] = useState<{ categories: string[], statuts: string[], poles: string[] }>({
    categories: [],
    statuts: [],
    poles: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const filterOptions = await dataService.getFilterOptions();
        setOptions(filterOptions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  return { options, loading, error };
};

// Hooks pour les graphiques de délais
export const useDelaisStats = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await dataService.getStatsDelais(filters);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

export const useDelaisParAO = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await dataService.getStatsDelaisParAO(filters);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

export const useDelaisTranches = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await dataService.getStatsDelaisTranches(filters);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

export const useTop5Delais = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await dataService.getTop5Delais(filters);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

// Hooks pour les graphiques de notes
export const useNotesTranches = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await dataService.getStatsNotesTranches(filters);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

export const useNotesQualitatives = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await dataService.getStatsNotesQualitatives(filters);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

export const useNotesBox = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await dataService.getStatsNotesBox(filters);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

// Hooks pour les graphiques de prix
export const usePrixTranches = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await dataService.getStatsPrixTranches(filters);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

export const usePositionnementPrix = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await dataService.getStatsPositionnementPrix(filters);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

export const usePrixBox = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await dataService.getStatsPrixBox(filters);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

export const useTauxSuccesPrix = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await dataService.getStatsTauxSuccesPrix(filters);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

// Hooks pour les graphiques de comparaison
export const useEcartsCategorie = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await dataService.getStatsEcartsCategorie(filters);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

export const useEcartsTranches = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await dataService.getStatsEcartsTranches(filters);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

export const useEcartsBox = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await dataService.getStatsEcartsBox(filters);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

export const useTop5EcartsFaibles = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await dataService.getTop5EcartsFaibles(filters);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

export const useTop5EcartsForts = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await dataService.getTop5EcartsForts(filters);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

// Hook pour l'évolution du taux de succès par mois
export const useGagnePerduEvolutionMois = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const rawData = await dataService.getGagnePerduEvolutionMois(filters);
        
        // Traitement des données pour créer l'évolution par mois
        const monthlyData: { [key: string]: { gagne: number; perdu: number; total: number } } = {};
        
        rawData.forEach((item: any) => {
          const mois = item._id.mois;
          const statut = item._id.statut;
          const count = item.count;
          
          if (!monthlyData[mois]) {
            monthlyData[mois] = { gagne: 0, perdu: 0, total: 0 };
          }
          
          if (statut === 'Gagné') {
            monthlyData[mois].gagne = count;
          } else if (statut === 'Perdu') {
            monthlyData[mois].perdu = count;
          }
          monthlyData[mois].total += count;
        });

        // Convertir en tableau et calculer le taux de succès
        const processedData = Object.entries(monthlyData)
          .map(([mois, stats]) => ({
            mois,
            taux_succes: stats.total > 0 ? (stats.gagne / stats.total) * 100 : 0,
            gagne: stats.gagne,
            perdu: stats.perdu,
            total: stats.total
          }))
          .sort((a, b) => a.mois.localeCompare(b.mois));

        setData(processedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

// Hook pour le taux de succès par catégorie
export const useGagnePerduTauxSuccesCategorie = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const rawData = await dataService.getGagnePerduTauxSuccesCategorie(filters);
        
        // Les données sont déjà traitées par le backend
        setData(rawData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
};

// Hook pour le taux de succès par pôle
export const useGagnePerduTauxSuccesPole = (filters: FilterState) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const rawData = await dataService.getGagnePerduTauxSuccesPole(filters);
        
        // Les données sont déjà traitées par le backend
        setData(rawData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
}; 