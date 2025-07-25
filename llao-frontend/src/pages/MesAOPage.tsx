import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Tabs, { TabItem } from '../components/Tabs';
import InsertionDocumentsPage from './InsertionDocumentsPage';
import TableauAOPage from './TableauAOPage';
import MesAOFavorisPage from './MesAOFavorisPage';
import RechercheAOPage from './RechercheAOPage';
import ComparaisonAOPage from './ComparaisonAOPage';

const mesAOTabs: TabItem[] = [
  { label: 'Insertion', to: 'insertion-documents' },
  { label: 'Tableau des AO', to: 'tableau-ao' },
  { label: 'Mes Favoris', to: 'mes-favoris' },
  { label: 'Recherche', to: 'recherche-ao' },
  { label: 'Comparaison', to: 'comparaison' },
];

const MesAOPage: React.FC = () => (
  <div className="p-4 sm:p-6 md:p-8">
    <Tabs tabs={mesAOTabs} />
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 dark:bg-dark-backgroundSecondary">
      <Routes>
        <Route path="insertion-documents" element={<InsertionDocumentsPage />} />
        <Route path="tableau-ao" element={<TableauAOPage />} />
        <Route path="mes-favoris" element={<MesAOFavorisPage />} />
        <Route path="recherche-ao" element={<RechercheAOPage />} />
        <Route path="comparaison" element={<ComparaisonAOPage />} />
        <Route path="" element={<Navigate to="tableau-ao" />} />
      </Routes>
    </div>
  </div>
);

export default MesAOPage; 