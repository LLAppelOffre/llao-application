import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Plot from 'react-plotly.js';
import Tabs, { TabItem } from '../components/Tabs';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Graphique {
  graph_id: string;
  titre: string;
  filtres: Record<string, any[]>;
}

interface Dashboard {
  id: string;
  nom: string;
  graphiques: Graphique[];
  date_creation?: string;
  date_maj?: string;
}

// Données fictives inspirées du modèle backend
const fakeDashboards: Dashboard[] = [
  {
    id: '1',
    nom: 'Analyse des ventes',
    graphiques: [
      {
        graph_id: 'g1',
        titre: 'Ventes par mois',
        filtres: { annee: ['2023'] },
      },
      {
        graph_id: 'g2',
        titre: 'Répartition par catégorie',
        filtres: { categorie: ['A', 'B', 'C'] },
      },
    ],
    date_creation: '2024-06-01',
    date_maj: '2024-06-25',
  },
];

// Couleurs de la charte graphique
const chartColors = {
  primary: '#37966F',
  background: '#F0FFF4',
  text: '#1A1A1A',
  textSecondary: '#4A635D',
  border: '#D0E8DA',
};

const dashboardsTabs: TabItem[] = [
  { label: 'Dashboards', to: '/dashboards' },
];

const DashboardsPage: React.FC = () => {
  const { token } = useAuth();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [renamingDashboard, setRenamingDashboard] = useState<Dashboard | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    const fetchDashboards = async () => {
      if (!token) {
        setError("Vous n'êtes pas authentifié.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/dashboards', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des dashboards');
        }
        const data = await response.json();
        setDashboards(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboards();
  }, [token]);

  const handleStartRename = (dashboard: Dashboard) => {
    setRenamingDashboard(dashboard);
    setNewName(dashboard.nom);
  };

  const handleCancelRename = () => {
    setRenamingDashboard(null);
    setNewName('');
  };

  const handleConfirmRename = async () => {
    if (!renamingDashboard || !token) return;

    try {
      const response = await fetch(`/api/dashboards/${renamingDashboard.id}/rename`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nom: newName }),
      });

      if (!response.ok) {
        throw new Error('Le renommage a échoué.');
      }

      const updatedDashboard = await response.json();
      setDashboards(dashboards.map(d => (d.id === updatedDashboard.id ? updatedDashboard : d)));
      handleCancelRename();
      // Optionnel: ajouter un toast de succès
    } catch (err) {
      // Gérer l'erreur, par exemple avec un toast
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Tabs tabs={dashboardsTabs} />
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 dark:bg-dark-backgroundSecondary">
        <h1 className="text-2xl font-title font-bold mb-6 text-primary dark:text-dark-primary">Vos Dashboards</h1>
        {error ? (
          <div className="flex flex-col items-center justify-center py-16 text-error animate-fadeIn" aria-live="polite">
            <ExclamationCircleIcon className="w-12 h-12 mb-2" />
            <div className="text-lg font-semibold mb-1">Erreur</div>
            <div>{error}</div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-textSecondary animate-fadeIn" aria-live="polite">
            <ExclamationCircleIcon className="w-12 h-12 mb-2" />
            <div className="text-lg font-semibold mb-1">Chargement...</div>
          </div>
        ) : dashboards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-textSecondary animate-fadeIn" aria-live="polite">
            <ExclamationCircleIcon className="w-12 h-12 mb-2" />
            <div className="text-lg font-semibold mb-1">Aucun dashboard trouvé</div>
            <div>Créez un dashboard pour commencer.</div>
          </div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {dashboards.map(d => (
            <div key={d.id} className="bg-white rounded-xl shadow p-6 relative group">
              <div className="flex justify-between items-start">
                <h2 className="text-primary text-xl font-title font-semibold mb-2">{d.nom}</h2>
                <button 
                  onClick={() => handleStartRename(d)} 
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Renommer le dashboard"
                >
                  <PencilIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="text-xs text-textSecondary mb-3">
                Créé le {d.date_creation} | Modifié le {d.date_maj}
              </div>
              {d.graphiques.map(g => (
                <div key={g.graph_id} className="mb-6">
                  <h3 className="mb-2 text-lg font-body font-medium">{g.titre}</h3>
                  {/* Graphique Plotly fictif */}
                  <Plot
                    data={[
                      {
                        x: ['A', 'B', 'C', 'D'],
                        y: [Math.random()*10, Math.random()*10, Math.random()*10, Math.random()*10],
                        type: 'bar',
                        marker: { color: chartColors.primary },
                      },
                    ]}
                    layout={{
                      width: 400,
                      height: 250,
                      title: {
                        text: g.titre,
                        font: {
                          family: 'Manrope, sans-serif',
                          color: chartColors.text,
                        },
                      },
                      paper_bgcolor: chartColors.background,
                      plot_bgcolor: chartColors.background,
                      font: {
                        family: 'IBM Plex Sans, sans-serif',
                        color: chartColors.textSecondary,
                      },
                      xaxis: {
                        gridcolor: chartColors.border,
                      },
                      yaxis: {
                        gridcolor: chartColors.border,
                      }
                    }}
                    config={{ displayModeBar: false }}
                  />
                  <div className="text-xs text-textSecondary">
                    Filtres : {Object.entries(g.filtres).map(([k, v]) => `${k}: [${v.join(', ')}]`).join(' | ')}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {renamingDashboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Renommer le dashboard</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2 border rounded"
              autoFocus
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={handleCancelRename} className="px-4 py-2 rounded text-gray-600 hover:bg-gray-100">
                <XMarkIcon className="w-5 h-5 inline-block mr-1" />
                Annuler
              </button>
              <button onClick={handleConfirmRename} className="px-4 py-2 rounded bg-primary text-white hover:bg-green-700">
                <CheckIcon className="w-5 h-5 inline-block mr-1" />
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardsPage; 