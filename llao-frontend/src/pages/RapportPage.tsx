import React from 'react';
import Tabs, { TabItem } from '../components/Tabs';

const rapportTabs: TabItem[] = [
  { label: 'Rapport', to: '/rapport' },
];

const RapportPage: React.FC = () => (
  <div className="p-4 sm:p-6 md:p-8">
    <Tabs tabs={rapportTabs} />
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 dark:bg-dark-backgroundSecondary">
      <h1 className="text-2xl font-title font-bold mb-6 text-primary dark:text-dark-primary">Rapport</h1>
      <div className="text-textSecondary dark:text-dark-textSecondary">(Fonctionnalité à venir)</div>
    </div>
  </div>
);

export default RapportPage; 