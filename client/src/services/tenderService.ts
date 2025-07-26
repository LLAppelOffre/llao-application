import apiService from './api';
import { Tender, TenderCreate, TenderFilters, TenderStats, TenderSearchResult } from '../types/tender';

export class TenderService {
  // Récupérer tous les appels d'offres
  async getTenders(filters?: TenderFilters): Promise<Tender[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/tenders?${queryString}` : '/tenders';
    return apiService.get<Tender[]>(endpoint);
  }

  // Récupérer un appel d'offres par ID
  async getTender(id: string): Promise<Tender> {
    return apiService.get<Tender>(`/tenders/${id}`);
  }

  // Créer un nouvel appel d'offres
  async createTender(tender: TenderCreate): Promise<Tender> {
    return apiService.post<Tender>('/tenders', tender);
  }

  // Mettre à jour un appel d'offres
  async updateTender(id: string, tender: Partial<Tender>): Promise<Tender> {
    return apiService.patch<Tender>(`/tenders/${id}`, tender);
  }

  // Supprimer un appel d'offres
  async deleteTender(id: string): Promise<void> {
    return apiService.delete(`/tenders/${id}`);
  }

  // Statistiques gagné/perdu
  async getWinLossStats(filters?: TenderFilters): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/tenders/stats/win-loss?${queryString}` : '/tenders/stats/win-loss';
    return apiService.get<any[]>(endpoint);
  }

  // Évolution du taux de succès par mois
  async getWinLossEvolution(filters?: TenderFilters): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/tenders/stats/win-loss-evolution-month?${queryString}` : '/tenders/stats/win-loss-evolution-month';
    return apiService.get<any[]>(endpoint);
  }

  // Taux de succès par catégorie
  async getSuccessRateByCategory(filters?: TenderFilters): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/tenders/stats/success-rate-by-category?${queryString}` : '/tenders/stats/success-rate-by-category';
    return apiService.get<any[]>(endpoint);
  }

  // Statistiques des délais
  async getDelaysStats(filters?: TenderFilters): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/tenders/stats/delays?${queryString}` : '/tenders/stats/delays';
    return apiService.get<any[]>(endpoint);
  }

  // Statistiques des notes
  async getScoresStats(filters?: TenderFilters): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/tenders/stats/scores?${queryString}` : '/tenders/stats/scores';
    return apiService.get<any[]>(endpoint);
  }

  // Statistiques des prix
  async getPricingStats(filters?: TenderFilters): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/tenders/stats/pricing?${queryString}` : '/tenders/stats/pricing';
    return apiService.get<any[]>(endpoint);
  }

  // Statistiques de comparaison
  async getComparisonStats(filters?: TenderFilters): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/tenders/stats/comparison?${queryString}` : '/tenders/stats/comparison';
    return apiService.get<any[]>(endpoint);
  }

  // Options de filtres
  async getFilterOptions(): Promise<{
    categories: string[];
    statuts: string[];
    poles: string[];
  }> {
    return apiService.get('/tenders/filters/options');
  }

  // Recherche d'appels d'offres
  async searchTenders(query: string): Promise<TenderSearchResult[]> {
    return apiService.get<TenderSearchResult[]>(`/tenders/search?q=${encodeURIComponent(query)}`);
  }

  // Export Excel
  async exportExcel(filters?: TenderFilters): Promise<void> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/tenders/export/excel?${queryString}` : '/tenders/export/excel';
    return apiService.downloadFile(endpoint, 'appels_offres.xlsx');
  }

  // Gestion des favoris
  async addToFavorites(tenderId: string): Promise<{ message: string }> {
    return apiService.post<{ message: string }>(`/tenders/favorites/${tenderId}`);
  }

  async removeFromFavorites(tenderId: string): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(`/tenders/favorites/${tenderId}`);
  }

  async getFavorites(): Promise<Tender[]> {
    return apiService.get<Tender[]>('/tenders/favorites/');
  }
}

export const tenderService = new TenderService();
export default tenderService; 