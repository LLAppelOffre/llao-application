export interface Chart {
  chart_id: string;
  titre: string;
  instance_id?: string;
  filtres: Record<string, any>;
  text?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  size?: string;
  height?: string;
  order?: number;
  customTitle?: string;
}

export interface Dashboard {
  id?: string;
  nom: string;
  graphiques: Chart[];
  filtres_globaux?: Record<string, any>;
  user_id: string;
  date_creation?: string;
  date_maj?: string;
}

export interface DashboardCreate {
  nom: string;
  graphiques: Chart[];
  filtres_globaux?: Record<string, any>;
}

export interface LayoutItem {
  instance_id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ChartType {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
} 