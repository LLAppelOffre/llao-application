import React, { useState, useEffect, useCallback } from 'react';
import { FilterState } from '../hooks/useGraphData';
import { WidgetFilters } from './visualisation/MesTableauxBordsPage';
import DataTable, { DataTableColumn } from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';

const TableauAOPage: React.FC = () => {
  const { token } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    statuts: [],
    poles: [],
    dateDebut: '',
    dateFin: '',
  });
  const [aoData, setAoData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    const fetchFavorites = async () => {
      try {
        const res = await fetch('/appels_offres/favorites/ao', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Erreur chargement favoris');
        const data = await res.json();
        setFavoriteIds(data.map((ao: any) => ao._id));
      } catch {
        setFavoriteIds([]);
      }
    };
    fetchFavorites();
  }, [token]);

  // Toggle favori
  const handleToggleFavorite = async (ao_id: string, isFav: boolean) => {
    setFavoriteIds(prev => isFav ? prev.filter(id => id !== ao_id) : [...prev, ao_id]); // UX optimiste
    try {
      const url = `/appels_offres/favorites/ao/${ao_id}`;
      const res = await fetch(url, {
        method: isFav ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur favoris');
    } catch {
      // Rollback si erreur
      setFavoriteIds(prev => isFav ? [...prev, ao_id] : prev.filter(id => id !== ao_id));
    }
  };

  const handleSelectRow = (ao_id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, ao_id] : prev.filter(id => id !== ao_id));
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(aoData.map(row => row._id));
    } else {
      setSelectedIds([]);
    }
  };

  const columns: DataTableColumn[] = [
    {
      Header: '',
      accessor: 'select',
    },
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

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.categories.length > 0) params.append('categorie', filters.categories[0]);
    if (filters.statuts.length > 0) params.append('statut', filters.statuts[0]);
    if (filters.poles.length > 0) params.append('pole', filters.poles[0]);
    if (filters.dateDebut) params.append('date_debut', filters.dateDebut);
    if (filters.dateFin) params.append('date_fin', filters.dateFin);
    return params.toString();
  }, [filters]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        const qs = buildQueryString();
        const res = await fetch(`/appels_offres/${qs ? '?' + qs : ''}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Erreur lors du chargement des AO');
        const data = await res.json();
        setAoData(data);
      } catch (err: any) {
        setError(err.message || 'Erreur inconnue');
        setAoData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters, token, buildQueryString]);

  const handleFilterChange = (filterType: keyof FilterState, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      categories: [],
      statuts: [],
      poles: [],
      dateDebut: '',
      dateFin: '',
    });
  };

  const handleExportExcel = async () => {
    if (!token) return;
    setExporting(true);
    setExportError(null);
    try {
      const qs = buildQueryString();
      const res = await fetch(`/appels_offres/export/excel${qs ? '?' + qs : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur lors de l\'export Excel');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'appels_offres.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err.message || 'Erreur inconnue');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <section className="mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <WidgetFilters filters={filters} onChange={handleFilterChange} />
          </div>
          <button className="ml-6 mt-2 px-4 py-2 border border-border rounded-lg hover:bg-backgroundSecondary transition-colors dark:border-dark-border dark:hover:bg-dark-backgroundSecondary" onClick={handleResetFilters}>
            Réinitialiser
          </button>
        </div>
      </section>
      <section>
        <div className="flex justify-end mb-4">
          <button onClick={handleExportExcel} disabled={exporting || loading} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-gray-400 dark:hover:bg-dark-hover">
            {exporting ? 'Export en cours...' : 'Exporter Excel'}
          </button>
        </div>
        {exportError && <div className="text-center p-4 text-error dark:text-dark-error">{exportError}</div>}
        {loading && <div className="text-center p-4">Chargement...</div>}
        {error && <div className="text-center p-4 text-error dark:text-dark-error">{error}</div>}
        {!loading && !error && <DataTable columns={columns} data={aoData.map(row => ({
          ...row,
          select: (
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={selectedIds.includes(row._id)}
              onChange={e => handleSelectRow(row._id, e.target.checked)}
              onClick={e => e.stopPropagation()}
            />
          ),
          favori: (
            <span className="cursor-pointer" onClick={e => { e.stopPropagation(); handleToggleFavorite(row._id, favoriteIds.includes(row._id)); }}>
              {favoriteIds.includes(row._id)
                ? <StarIcon className="h-6 w-6 text-yellow-400" />
                : <StarIconOutline className="h-6 w-6 text-gray-400" />}
            </span>
          ),
          statut: row.statut ? (
            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
              row.statut === 'Gagné' ? 'bg-green-600 text-white' :
              row.statut === 'Perdu' ? 'bg-red-600 text-white' :
              'bg-yellow-400 text-text'
            }`}>
              {row.statut}
            </span>
          ) : ''
        }))} />}
      </section>
    </div>
  );
};

export default TableauAOPage; 