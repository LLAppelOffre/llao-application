import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:8000';

export interface FilterState {
  categories: string[];
  statuts: string[];
  poles: string[];
  dateDebut: string;
  dateFin: string;
}

export interface AOData {
  _id: string;
  nom_ao: string;
  categorie: string;
  pole: string;
  statut: string;
  date_emission: string;
  date_reponse: string;
  prix_client: number;
  prix_gagnant: number;
  note_technique: number;
  note_prix: number;
  delai_jours: number;
  ecart_score: number;
  ecart_prix: number;
  score_client: number;
  score_gagnant: number;
}

export interface StatsGagnePerdu {
  _id: string;
  count: number;
}

export interface StatsParCategorie {
  _id: {
    categorie: string;
    statut: string;
  };
  count: number;
}

export interface StatsParPole {
  _id: {
    pole: string;
    statut: string;
  };
  count: number;
}

export interface StatsDelais {
  _id: string;
  delai_moyen: number;
  delai_min: number;
  delai_max: number;
  count: number;
}

export interface StatsNotes {
  _id: string;
  note_moyenne: number;
  note_min: number;
  note_max: number;
  count: number;
}

export interface StatsPrix {
  _id: string;
  prix_moyen: number;
  prix_min: number;
  prix_max: number;
  ecart_prix_moyen: number;
  count: number;
}

export interface Top5Data {
  nom_ao: string;
  categorie: string;
  note_technique?: number;
  ecart_score?: number;
  statut: string;
}

class DataService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private buildQueryParams(filters: FilterState): string {
    const params = new URLSearchParams();
    
    if (filters.categories.length > 0) {
      filters.categories.forEach(cat => params.append('categorie', cat));
    }
    if (filters.statuts.length > 0) {
      filters.statuts.forEach(statut => params.append('statut', statut));
    }
    if (filters.poles.length > 0) {
      filters.poles.forEach(pole => params.append('pole', pole));
    }
    if (filters.dateDebut) {
      params.append('date_debut', filters.dateDebut);
    }
    if (filters.dateFin) {
      params.append('date_fin', filters.dateFin);
    }
    
    return params.toString();
  }

  // Récupérer toutes les données AO
  async getAOData(filters: FilterState = { categories: [], statuts: [], poles: [], dateDebut: '', dateFin: '' }): Promise<AOData[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/?${queryParams}`;
    
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des données AO: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Statistiques gagné/perdu
  async getStatsGagnePerdu(filters: FilterState): Promise<StatsGagnePerdu[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/gagne-perdu?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsGagnePerdu]', filters);
    console.log('[API] getStatsGagnePerdu:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats gagné/perdu: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Statistiques par catégorie
  async getStatsParCategorie(filters: FilterState): Promise<StatsParCategorie[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/par-categorie?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsParCategorie]', filters);
    console.log('[API] getStatsParCategorie:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats par catégorie: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Statistiques par pôle
  async getStatsParPole(filters: FilterState): Promise<StatsParPole[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/par-pole?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsParPole]', filters);
    console.log('[API] getStatsParPole:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats par pôle: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Statistiques des délais
  async getStatsDelais(filters: FilterState): Promise<StatsDelais[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/delais?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsDelais]', filters);
    console.log('[API] getStatsDelais:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats délais: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Statistiques des notes
  async getStatsNotes(filters: FilterState): Promise<StatsNotes[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/notes?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsNotes]', filters);
    console.log('[API] getStatsNotes:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats notes: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Statistiques des prix
  async getStatsPrix(filters: FilterState): Promise<StatsPrix[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/prix?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsPrix]', filters);
    console.log('[API] getStatsPrix:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats prix: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Statistiques comparaison
  async getStatsComparaison(filters: FilterState): Promise<StatsPrix[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/comparaison?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsComparaison]', filters);
    console.log('[API] getStatsComparaison:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats comparaison: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Top 5 notes
  async getTop5Notes(filters: FilterState): Promise<Top5Data[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/top5/notes?${queryParams}`;
    
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération du top 5 notes: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Top 5 écarts
  async getTop5Ecarts(filters: FilterState): Promise<Top5Data[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/top5/ecarts?${queryParams}`;
    
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération du top 5 écarts: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Statistiques des délais par AO
  async getStatsDelaisParAO(filters: FilterState): Promise<any[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/delais-par-ao?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsDelaisParAO]', filters);
    console.log('[API] getStatsDelaisParAO:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats délais par AO: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Statistiques des délais par tranches
  async getStatsDelaisTranches(filters: FilterState): Promise<any[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/delais-tranches?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsDelaisTranches]', filters);
    console.log('[API] getStatsDelaisTranches:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats délais par tranches: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Top 5 des délais
  async getTop5Delais(filters: FilterState): Promise<any[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/top5/delais?${queryParams}`;
    
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération du top 5 des délais: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Statistiques des notes par tranches
  async getStatsNotesTranches(filters: FilterState): Promise<any[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/notes-tranches?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsNotesTranches]', filters);
    console.log('[API] getStatsNotesTranches:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats notes par tranches: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Statistiques des notes qualitatives
  async getStatsNotesQualitatives(filters: FilterState): Promise<any[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/notes-qualitatives?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsNotesQualitatives]', filters);
    console.log('[API] getStatsNotesQualitatives:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats notes qualitatives: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Données pour box plot des notes
  async getStatsNotesBox(filters: FilterState): Promise<any[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/notes-box?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsNotesBox]', filters);
    console.log('[API] getStatsNotesBox:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats notes box: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Statistiques des prix par tranches
  async getStatsPrixTranches(filters: FilterState): Promise<any[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/prix-tranches?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsPrixTranches]', filters);
    console.log('[API] getStatsPrixTranches:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats prix par tranches: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Statistiques du positionnement des prix
  async getStatsPositionnementPrix(filters: FilterState): Promise<any[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/positionnement-prix?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsPositionnementPrix]', filters);
    console.log('[API] getStatsPositionnementPrix:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats positionnement prix: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Données pour box plot des prix
  async getStatsPrixBox(filters: FilterState): Promise<any[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/prix-box?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsPrixBox]', filters);
    console.log('[API] getStatsPrixBox:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats prix box: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Taux de succès par tranche de prix
  async getStatsTauxSuccesPrix(filters: FilterState): Promise<any[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/taux-succes-prix?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsTauxSuccesPrix]', filters);
    console.log('[API] getStatsTauxSuccesPrix:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats taux succès prix: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Statistiques des écarts par catégorie
  async getStatsEcartsCategorie(filters: FilterState): Promise<any[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/ecarts-categorie?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsEcartsCategorie]', filters);
    console.log('[API] getStatsEcartsCategorie:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats écarts par catégorie: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Statistiques des écarts par tranches
  async getStatsEcartsTranches(filters: FilterState): Promise<any[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/ecarts-tranches?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsEcartsTranches]', filters);
    console.log('[API] getStatsEcartsTranches:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats écarts par tranches: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Données pour box plot des écarts
  async getStatsEcartsBox(filters: FilterState): Promise<any[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/stats/ecarts-box?${queryParams}`;
    console.log('[API][Filtres envoyés][getStatsEcartsBox]', filters);
    console.log('[API] getStatsEcartsBox:', url);
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des stats écarts box: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Top 5 des écarts les plus faibles
  async getTop5EcartsFaibles(filters: FilterState): Promise<any[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/top5/ecarts-faibles?${queryParams}`;
    
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération du top 5 des écarts faibles: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Top 5 des écarts les plus forts
  async getTop5EcartsForts(filters: FilterState): Promise<any[]> {
    const queryParams = this.buildQueryParams(filters);
    const url = `${API_BASE_URL}/appels_offres/top5/ecarts-forts?${queryParams}`;
    
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération du top 5 des écarts forts: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Options des filtres
  async getFilterOptions(): Promise<{ categories: string[], statuts: string[], poles: string[] }> {
    const url = `${API_BASE_URL}/appels_offres/filtres/options`;
    
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des options de filtres: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Méthodes pour les graphiques gagné/perdus
  async getGagnePerduStats(filters: FilterState): Promise<any> {
    const params = new URLSearchParams();
    if (filters.categories.length > 0) params.append('categorie', filters.categories.join(','));
    if (filters.statuts.length > 0) params.append('statut', filters.statuts.join(','));
    if (filters.poles.length > 0) params.append('pole', filters.poles.join(','));
    if (filters.dateDebut) params.append('date_debut', filters.dateDebut);
    if (filters.dateFin) params.append('date_fin', filters.dateFin);
    const url = `${API_BASE_URL}/appels_offres/stats/gagne-perdu?${params}`;
    console.log('[API][Filtres envoyés][getGagnePerduStats]', filters);
    console.log('[API] getGagnePerduStats:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erreur lors de la récupération des stats gagné/perdu');
    return response.json();
  }

  async getGagnePerduEvolutionMois(filters: FilterState): Promise<any> {
    const params = new URLSearchParams();
    if (filters.categories.length > 0) params.append('categorie', filters.categories.join(','));
    if (filters.statuts.length > 0) params.append('statut', filters.statuts.join(','));
    if (filters.poles.length > 0) params.append('pole', filters.poles.join(','));
    if (filters.dateDebut) params.append('date_debut', filters.dateDebut);
    if (filters.dateFin) params.append('date_fin', filters.dateFin);

    const response = await fetch(`${API_BASE_URL}/appels_offres/stats/gagne-perdu-evolution-mois?${params}`);
    if (!response.ok) throw new Error('Erreur lors de la récupération de l\'évolution par mois');
    return response.json();
  }

  async getGagnePerduTauxSuccesCategorie(filters: FilterState): Promise<any> {
    const params = new URLSearchParams();
    if (filters.categories.length > 0) params.append('categorie', filters.categories.join(','));
    if (filters.statuts.length > 0) params.append('statut', filters.statuts.join(','));
    if (filters.poles.length > 0) params.append('pole', filters.poles.join(','));
    if (filters.dateDebut) params.append('date_debut', filters.dateDebut);
    if (filters.dateFin) params.append('date_fin', filters.dateFin);

    const response = await fetch(`${API_BASE_URL}/appels_offres/stats/gagne-perdu-taux-succes-categorie?${params}`);
    if (!response.ok) throw new Error('Erreur lors de la récupération du taux de succès par catégorie');
    return response.json();
  }

  async getGagnePerduTauxSuccesPole(filters: FilterState): Promise<any> {
    const params = new URLSearchParams();
    if (filters.categories.length > 0) params.append('categorie', filters.categories.join(','));
    if (filters.statuts.length > 0) params.append('statut', filters.statuts.join(','));
    if (filters.poles.length > 0) params.append('pole', filters.poles.join(','));
    if (filters.dateDebut) params.append('date_debut', filters.dateDebut);
    if (filters.dateFin) params.append('date_fin', filters.dateFin);

    const response = await fetch(`${API_BASE_URL}/appels_offres/stats/gagne-perdu-taux-succes-pole?${params}`);
    if (!response.ok) throw new Error('Erreur lors de la récupération du taux de succès par pôle');
    return response.json();
  }
}

export const dataService = new DataService(); 