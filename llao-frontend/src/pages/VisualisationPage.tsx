import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MesTableauxBordsPage from './visualisation/MesTableauxBordsPage';
import BibliothequeGraphiquePage from './visualisation/BibliothequeGraphiquePage';
import Tabs from '../components/Tabs';

const visualisationTabs = [
  { label: 'Mes Tableaux de Bords', to: 'mes-tableaux-bords' },
  { label: 'Bibliothèque de Graphiques', to: 'bibliotheque-graphique' },
];

const VisualisationPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Tabs tabs={visualisationTabs} />
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 dark:bg-dark-backgroundSecondary">
        <Routes>
          <Route path="mes-tableaux-bords/*" element={<MesTableauxBordsPage />} />
          <Route path="bibliotheque-graphique" element={<BibliothequeGraphiquePage />} />
          <Route path="" element={<Navigate to="mes-tableaux-bords" />} />
        </Routes>
      </div>
    </div>
  );
};

export default VisualisationPage; 