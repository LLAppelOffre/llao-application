import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ChartBarIcon, 
  DocumentTextIcon, 
  InboxIcon, 
  MagnifyingGlassIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

const tabs = [
  { label: 'Visualisation', path: '/visualisation', icon: <ChartBarIcon className="w-6 h-6" /> },
  { label: 'Mes AO', path: '/mes-ao', icon: <DocumentTextIcon className="w-6 h-6" /> },
  { label: 'Rapport', path: '/rapport', icon: <InboxIcon className="w-6 h-6" /> },
  { label: 'Sélection AO', path: '/selection-ao-pertinents', icon: <MagnifyingGlassIcon className="w-6 h-6" /> },
  { label: 'Répondre à un AO', path: '/repondre-ao', icon: <PencilSquareIcon className="w-6 h-6" /> },
];

type MainTabsProps = {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

const MainTabs: React.FC<MainTabsProps> = ({ collapsed, setCollapsed }) => {
  const toggleCollapse = () => setCollapsed(c => !c);

  return (
    <aside className={`flex flex-col gap-3 bg-backgroundSecondary py-4 border-r-2 border-border min-h-screen fixed left-0 top-0 z-10 transition-all duration-300 ease-in-out dark:bg-dark-backgroundSecondary dark:border-dark-border ${collapsed ? 'w-20 items-center' : 'w-64'}`}>
      <button
        className="text-textSecondary hover:text-primary dark:text-dark-textSecondary dark:hover:text-dark-primary self-end p-2 mx-4 rounded-lg hover:bg-hover dark:hover:bg-dark-hover transition-colors"
        onClick={toggleCollapse}
        aria-label="Toggle sidebar"
      >
        {collapsed ? <ChevronRightIcon className="w-6 h-6" /> : <ChevronLeftIcon className="w-6 h-6" />}
      </button>
      <nav className="flex flex-col gap-2 mt-4">
        {tabs.map(tab => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex items-center gap-4 text-textSecondary font-medium text-base no-underline px-6 py-3 transition-colors duration-200 ${
                isActive 
                  ? 'bg-primary/10 text-primary border-r-4 border-primary dark:bg-dark-primary/20 dark:text-dark-secondary' 
                  : 'hover:bg-hover dark:hover:bg-dark-hover'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <div className="w-6 h-6">{tab.icon}</div>
            {!collapsed && <span className="tab-label">{tab.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default MainTabs; 