export interface Tender {
  id?: string;
  nom_ao: string;
  categorie: string;
  pole: string;
  statut: string;
  date_emission: string;
  date_reponse?: string;
  prix_client?: number;
  prix_gagnant?: number;
  note_technique?: number;
  note_prix?: number;
  score_client?: number;
  score_gagnant?: number;
  delai_jours?: number;
  commentaires_ia?: string;
  raison_perte?: string;
  date_creation?: string;
  date_maj?: string;
}

export interface TenderCreate {
  nom_ao: string;
  categorie: string;
  pole: string;
  statut: string;
  date_emission: string;
  date_reponse?: string;
  prix_client?: number;
  prix_gagnant?: number;
  note_technique?: number;
  note_prix?: number;
  score_client?: number;
  score_gagnant?: number;
  delai_jours?: number;
  commentaires_ia?: string;
  raison_perte?: string;
}

export interface TenderFilters {
  categorie?: string;
  statut?: string;
  pole?: string;
  date_debut?: string;
  date_fin?: string;
}

export interface TenderStats {
  total: number;
  gagne: number;
  perdu: number;
  in_progress: number;
  taux_succes: number;
}

export interface TenderSearchResult {
  id: string;
  nom_ao: string;
} 