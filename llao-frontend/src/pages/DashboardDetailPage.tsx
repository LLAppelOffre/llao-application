import React from 'react';
import Tabs, { TabItem } from '../components/Tabs';

const detailTabs: TabItem[] = [
  { label: 'Détail Dashboard', to: '/dashboard-detail' },
];

const DashboardDetailPage: React.FC = () => (
  <div className="p-4 sm:p-6 md:p-8 min-h-screen flex flex-col items-center justify-center">
    <Tabs tabs={detailTabs} />
    <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-6 dark:bg-dark-backgroundSecondary dark:border dark:border-dark-border">
      <h2 className="text-center mb-6 text-2xl font-title font-semibold dark:text-dark-text">Détail Dashboard</h2>
      <div className="text-textSecondary dark:text-dark-textSecondary">(Fonctionnalité à venir)</div>
    </div>
  </div>
);

export default DashboardDetailPage; 