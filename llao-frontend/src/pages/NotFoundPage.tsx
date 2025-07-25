import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background dark:bg-dark-background">
    <ExclamationTriangleIcon className="w-20 h-20 text-error dark:text-dark-error mb-6" />
    <h1 className="text-4xl font-title font-bold text-primary dark:text-dark-primary mb-4">404 - Page non trouvée</h1>
    <p className="text-textSecondary dark:text-dark-textSecondary mb-8">La page que vous cherchez n'existe pas ou a été déplacée.</p>
    <Link to="/" className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors dark:bg-dark-primary">Retour à l'accueil</Link>
  </div>
);

export default NotFoundPage; 