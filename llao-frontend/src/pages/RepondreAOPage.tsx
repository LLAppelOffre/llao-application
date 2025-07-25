import React from 'react';
import Tabs, { TabItem } from '../components/Tabs';

const repondreTabs: TabItem[] = [
  { label: 'Répondre à un AO', to: '/repondre-ao' },
];

const RepondreAOPage: React.FC = () => (
  <div className="p-4 sm:p-6 md:p-8">
    <Tabs tabs={repondreTabs} />
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 dark:bg-dark-backgroundSecondary">
      <h1 className="text-2xl font-title font-bold mb-6 text-primary dark:text-dark-primary">Répondre à un AO</h1>
      <div className="text-textSecondary dark:text-dark-textSecondary">(Fonctionnalité à venir)</div>
    </div>
  </div>
);

export default RepondreAOPage; 