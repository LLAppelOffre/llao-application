import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export interface TabItem {
  label: string;
  to: string;
}

interface TabsProps {
  tabs: TabItem[];
  className?: string;
  compact?: boolean; // pour les sous-onglets
}

const Tabs: React.FC<TabsProps> = ({ tabs, className = '', compact = false }) => {
  const location = useLocation();
  return (
    <nav
      className={`flex ${compact ? 'space-x-2' : 'space-x-2 sm:space-x-4'} border-b border-border mb-6 dark:border-dark-border ${className}`}
      aria-label="Navigation par onglets"
    >
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
        >
          {({ isActive }: { isActive: boolean }) => (
            <span
              className={
                `${compact ? 'py-2 px-2 text-sm' : 'py-3 px-2 sm:px-4 text-base'} font-medium text-center border-b-2 transition-colors duration-200 relative outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-dark-primary ` +
                (isActive
                  ? 'border-primary text-primary dark:text-dark-primary font-bold text-lg after:absolute after:left-0 after:bottom-0 after:w-full after:h-1 after:bg-primary dark:after:bg-dark-primary after:rounded-t-lg after:transition-all after:duration-300'
                  : 'border-transparent text-textSecondary hover:text-primary dark:text-dark-textSecondary dark:hover:text-dark-primary hover:bg-hover dark:hover:bg-dark-hover after:absolute after:left-0 after:bottom-0 after:w-0 after:h-1 after:bg-primary dark:after:bg-dark-primary after:rounded-t-lg after:transition-all after:duration-300 hover:after:w-full')
              }
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default Tabs; 