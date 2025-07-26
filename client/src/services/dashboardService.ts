import apiService from './api';
import { Dashboard, DashboardCreate, Chart, LayoutItem } from '../types/dashboard';

export class DashboardService {
  // Récupérer tous les tableaux de bord de l'utilisateur
  async getDashboards(): Promise<Dashboard[]> {
    return apiService.get<Dashboard[]>('/dashboards');
  }

  // Récupérer un tableau de bord par ID
  async getDashboard(id: string): Promise<Dashboard> {
    return apiService.get<Dashboard>(`/dashboards/${id}`);
  }

  // Créer un nouveau tableau de bord
  async createDashboard(dashboard: DashboardCreate): Promise<Dashboard> {
    return apiService.post<Dashboard>('/dashboards', dashboard);
  }

  // Mettre à jour un tableau de bord
  async updateDashboard(id: string, dashboard: Partial<Dashboard>): Promise<Dashboard> {
    return apiService.patch<Dashboard>(`/dashboards/${id}`, dashboard);
  }

  // Supprimer un tableau de bord
  async deleteDashboard(id: string): Promise<{ success: boolean; message: string }> {
    return apiService.delete<{ success: boolean; message: string }>(`/dashboards/${id}`);
  }

  // Renommer un tableau de bord
  async renameDashboard(id: string, name: string): Promise<Dashboard> {
    return apiService.patch<Dashboard>(`/dashboards/${id}/rename`, { nom: name });
  }

  // Ajouter un graphique à un tableau de bord
  async addChart(dashboardId: string, chart: Chart): Promise<Dashboard> {
    return apiService.post<Dashboard>(`/dashboards/${dashboardId}/add-chart`, chart);
  }

  // Supprimer un graphique d'un tableau de bord
  async removeChart(dashboardId: string, instanceId: string): Promise<Dashboard> {
    return apiService.delete<Dashboard>(`/dashboards/${dashboardId}/remove-chart/${instanceId}`);
  }

  // Mettre à jour les filtres d'un graphique
  async updateChartFilters(
    dashboardId: string, 
    chartId: string, 
    filters: Record<string, any>
  ): Promise<Dashboard> {
    return apiService.post<Dashboard>(`/dashboards/${dashboardId}/update-chart-filters`, {
      chart_id: chartId,
      filtres: filters
    });
  }

  // Mettre à jour les filtres globaux
  async updateGlobalFilters(
    dashboardId: string, 
    filters: Record<string, any>
  ): Promise<Dashboard> {
    return apiService.post<Dashboard>(`/dashboards/${dashboardId}/update-global-filters`, {
      filtres: filters
    });
  }

  // Mettre à jour le titre d'un graphique
  async updateChartTitle(
    dashboardId: string, 
    chartId: string, 
    title: string
  ): Promise<Dashboard> {
    return apiService.post<Dashboard>(`/dashboards/${dashboardId}/update-chart-title`, {
      chart_id: chartId,
      customTitle: title
    });
  }

  // Mettre à jour le texte d'un widget section
  async updateChartText(
    dashboardId: string, 
    chartId: string, 
    text: string
  ): Promise<Dashboard> {
    return apiService.post<Dashboard>(`/dashboards/${dashboardId}/update-chart-text`, {
      chart_id: chartId,
      text: text
    });
  }

  // Mettre à jour la disposition des graphiques
  async updateLayout(
    dashboardId: string, 
    layout: LayoutItem[]
  ): Promise<Dashboard> {
    return apiService.post<Dashboard>(`/dashboards/${dashboardId}/layout`, layout);
  }
}

export const dashboardService = new DashboardService();
export default dashboardService; 