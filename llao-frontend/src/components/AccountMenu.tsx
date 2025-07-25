import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SunIcon, MoonIcon, UserCircleIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

const AccountMenu: React.FC = () => {
  const { token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-backgroundSecondary shadow-md dark:bg-dark-backgroundSecondary">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" className="text-xl font-bold text-primary font-title">
              LL'AO
            </NavLink>
      </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-textSecondary hover:bg-hover hover:text-text transition-colors dark:text-dark-textSecondary dark:hover:bg-dark-hover dark:hover:text-dark-text"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <MoonIcon className="h-6 w-6" />
              ) : (
                <SunIcon className="h-6 w-6" />
              )}
            </button>
            {token ? (
              <>
                <NavLink to="/profile" className="flex items-center gap-2 text-textSecondary hover:text-primary transition-colors dark:text-dark-textSecondary dark:hover:text-dark-text">
                  <UserCircleIcon className="h-6 w-6" />
                  <span className="font-medium">Profil</span>
                </NavLink>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-textSecondary hover:text-primary transition-colors dark:text-dark-textSecondary dark:hover:text-dark-text"
                >
                  <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                  <span className="font-medium">Déconnexion</span>
            </button>
          </>
            ) : (
              <NavLink
                to="/login"
                className="text-textSecondary hover:text-primary transition-colors font-medium dark:text-dark-textSecondary dark:hover:text-dark-text"
              >
                Connexion
              </NavLink>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default AccountMenu; 