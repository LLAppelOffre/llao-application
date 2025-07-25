import React, { useEffect, useState } from 'react';
import DataTable, { DataTableColumn } from '../components/DataTable';
import Tabs, { TabItem } from '../components/Tabs';
import { useAuth } from '../context/AuthContext';
import { StarIcon, FolderOpenIcon } from '@heroicons/react/24/outline';

const favorisTabs: TabItem[] = [
  { label: 'Mes AO Favoris', to: '/mes-ao/mes-favoris' },
];

const MesAOFavorisPage: React.FC = () => {
  const { token } = useAuth();
  const [aoFavoris, setAOFavoris] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const fetchFavorites = async () => {
      try {
        const res = await fetch('/appels_offres/favorites/ao', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Erreur chargement favoris');
        const data = await res.json();
        setAOFavoris(data);
        setFavoriteIds(data.map((ao: any) => ao._id));
      } catch (err: any) {
        setError(err.message || 'Erreur inconnue');
        setAOFavoris([]);
        setFavoriteIds([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [token]);

  // Toggle favori (retirer uniquement)
  const handleToggleFavorite = async (ao_id: string) => {
    setFavoriteIds(prev => prev.filter(id => id !== ao_id));
    setAOFavoris(prev => prev.filter(ao => ao._id !== ao_id));
    try {
      const url = `/appels_offres/favorites/ao/${ao_id}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur suppression favori');
    } catch {
      // Rollback si erreur
      // (optionnel, ici on laisse optimiste)
    }
  };

  const columns: DataTableColumn[] = [
    {
      Header: '',
      accessor: 'favori',
    },
    { Header: 'Nom AO', accessor: 'nom_ao' },
    { Header: 'Catégorie', accessor: 'categorie' },
    { Header: 'Statut', accessor: 'statut' },
    { Header: 'Pôle', accessor: 'pole' },
    { Header: 'Date émission', accessor: 'date_emission' },
    { Header: 'Prix client', accessor: 'prix_client' },
    { Header: 'Prix gagnant', accessor: 'prix_gagnant' },
    { Header: 'Note technique', accessor: 'note_technique' },
    { Header: 'Note prix', accessor: 'note_prix' },
    { Header: 'Score client', accessor: 'score_client' },
    { Header: 'Score gagnant', accessor: 'score_gagnant' },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Tabs tabs={favorisTabs} />
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 dark:bg-dark-backgroundSecondary">
        <h1 className="text-2xl font-title font-bold mb-6 text-primary dark:text-dark-primary">Mes Appels d'Offres Favoris</h1>
        {loading && <div className="text-center p-4">Chargement...</div>}
        {error && <div className="text-center p-4 text-error">{error}</div>}
        {!loading && !error && aoFavoris.length === 0 && (
          <div className="text-center text-textSecondary py-16">
            <FolderOpenIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-text mb-2">Aucun favori pour le moment</h3>
            <p>Vous pouvez ajouter un appel d'offres à vos favoris depuis le tableau principal.</p>
          </div>
        )}
        {!loading && !error && aoFavoris.length > 0 && (
          <DataTable
            columns={columns}
            data={aoFavoris.map(row => ({
              ...row,
              favori: (
                <span className="cursor-pointer" onClick={e => { e.stopPropagation(); handleToggleFavorite(row._id); }}>
                  <StarIcon className="h-6 w-6 text-yellow-400" />
                </span>
              ),
              statut: row.statut ? (
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full uppercase ${
                  row.statut === 'Gagné' ? 'bg-green-600 text-white' :
                  row.statut === 'Perdu' ? 'bg-red-600 text-white' :
                  'bg-yellow-400 text-text'
                }`}>{row.statut}</span>
              ) : ''
            }))}
          />
        )}
      </div>
    </div>
  );
};

export default MesAOFavorisPage; 