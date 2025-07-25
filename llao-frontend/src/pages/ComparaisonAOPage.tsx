import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable, { DataTableColumn } from '../components/DataTable';
import { Radar, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  LinearScale,
  BarElement,
  CategoryScale,
} from 'chart.js';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Tabs, { TabItem } from '../components/Tabs';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, LinearScale, BarElement, CategoryScale);

const emptyAO = null;

// Couleurs de la charte pour les graphiques
const chartPalette = [
  'rgba(55, 150, 111, 0.7)', // primary
  'rgba(165, 214, 167, 0.7)', // secondary
  'rgba(74, 99, 93, 0.7)',     // textSecondary
  'rgba(244, 176, 132, 0.7)', // F4B084
  'rgba(211, 47, 47, 0.7)',   // error
];

const comparaisonTabs: TabItem[] = [
  { label: 'Comparaison d\'AO', to: '/mes-ao/comparaison' },
];

const ComparaisonAOPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [selectedAOs, setSelectedAOs] = useState<(any | null)[]>([emptyAO, emptyAO]);
  const [searchQueries, setSearchQueries] = useState<string[]>(['', '']);
  const [suggestions, setSuggestions] = useState<any[][]>([[], []]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string, idx: number) => {
    setSearchQueries(qs => qs.map((q, i) => i === idx ? query : q));
    if (!query || query.length < 2 || !token) {
      setSuggestions(sugs => sugs.map((s, i) => i === idx ? [] : s));
      return;
    }
    try {
      const res = await fetch(`/appels_offres/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur recherche AO');
      const data = await res.json();
      setSuggestions(sugs => sugs.map((s, i) => i === idx ? data : s));
    } catch {
      setSuggestions(sugs => sugs.map((s, i) => i === idx ? [] : s));
    }
  };

  const handleSelectAO = async (ao: any, idx: number) => {
    if (!ao._id || !token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/appels_offres/${ao._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur chargement AO');
      const fullAO = await res.json();
      setSelectedAOs(aos => aos.map((a, i) => i === idx ? fullAO : a));
      setSearchQueries(qs => qs.map((q, i) => i === idx ? fullAO.nom_ao : q));
      setSuggestions(sugs => sugs.map((s, i) => i === idx ? [] : s));
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBar = () => {
    setSelectedAOs(aos => [...aos, emptyAO]);
    setSearchQueries(qs => [...qs, '']);
    setSuggestions(sugs => [...sugs, []]);
  };

  const handleRemoveBar = (idx: number) => {
    if (selectedAOs.length <= 2) return;
    setSelectedAOs(aos => aos.filter((_, i) => i !== idx));
    setSearchQueries(qs => qs.filter((_, i) => i !== idx));
    setSuggestions(sugs => sugs.filter((_, i) => i !== idx));
  };

  const handleGoToFiche = (ao: any) => {
    navigate('/mes-ao/recherche-ao', { state: { ao } });
  };

  const aosToCompare = selectedAOs.filter(Boolean);

  const columns: DataTableColumn[] = [
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

  const radarLabels = ['Note technique', 'Note prix', 'Création', 'Équipe', 'Planification', 'RSE'];
  const radarData = {
    labels: radarLabels,
    datasets: aosToCompare.map((ao: any, idx) => ({
      label: ao.nom_ao,
      data: [
        ao.note_technique,
        ao.note_prix,
        ao.creation,
        ao.equipe,
        ao.planification,
        ao.rse,
      ],
      backgroundColor: chartPalette[idx % chartPalette.length].replace('0.7', '0.2'),
      borderColor: chartPalette[idx % chartPalette.length],
      borderWidth: 2,
      pointRadius: 4,
    })),
  };

  const prixLabels = aosToCompare.map((ao: any) => ao.nom_ao);
  const prixData = {
    labels: prixLabels,
    datasets: [
      {
        label: 'Prix client',
        data: aosToCompare.map((ao: any) => ao.prix_client),
        backgroundColor: chartPalette[0],
      },
      {
        label: 'Prix gagnant',
        data: aosToCompare.map((ao: any) => ao.prix_gagnant),
        backgroundColor: chartPalette[3],
      },
    ],
  };

  const timelineLabels = aosToCompare.map((ao: any) => ao.nom_ao);
  const timelineData = {
    labels: timelineLabels,
    datasets: [
      {
        label: 'Durée émission → attribution (jours)',
        data: aosToCompare.map((ao: any) => {
          const d1 = ao.date_emission ? dayjs(ao.date_emission) : null;
          const d2 = ao.date_attribution ? dayjs(ao.date_attribution) : null;
          return d1 && d2 ? d2.diff(d1, 'day') : null;
        }),
        backgroundColor: chartPalette[0],
      },
    ],
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Tabs tabs={comparaisonTabs} />
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 dark:bg-dark-backgroundSecondary">
        <h1 className="text-2xl font-title font-bold mb-6 text-primary dark:text-dark-primary">Comparaison d'Appels d'Offres</h1>
        <div className="bg-backgroundSecondary rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-primary mb-4">Sélectionnez les AO à comparer</h3>
          {selectedAOs.map((ao, idx) => (
            <div key={idx} className="flex items-center gap-3 mb-3">
              <div className="flex-grow relative">
                <input
                  type="text"
                  placeholder="Rechercher un AO par nom..."
                  value={searchQueries[idx]}
                  onChange={e => handleSearch(e.target.value, idx)}
                  className="w-full px-3 py-2 text-base border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                {suggestions[idx]?.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-border rounded-md mt-1 shadow-lg">
                    {suggestions[idx].map(s => (
                      <li key={s._id} className="px-3 py-2 cursor-pointer hover:bg-backgroundSecondary" onMouseDown={e => { e.preventDefault(); handleSelectAO(s, idx); }}>
                        {s.nom_ao}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {ao && (
                <>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase ${
                      ao.statut === 'Gagné' ? 'bg-green-600 text-white' :
                      ao.statut === 'Perdu' ? 'bg-red-600 text-white' :
                      'bg-yellow-400 text-text'
                  }`}>{ao.statut}</span>
                  <button onClick={() => handleGoToFiche(ao)} className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors">Voir fiche</button>
                </>
              )}
              {selectedAOs.length > 2 && (
                <button onClick={() => handleRemoveBar(idx)} className="w-8 h-8 flex-shrink-0 bg-error text-white rounded-md hover:bg-opacity-90 font-bold text-lg transition-colors">×</button>
              )}
            </div>
          ))}
          <button onClick={handleAddBar} className="mt-2 px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-opacity-90 transition-colors">+ Ajouter un AO</button>
        </div>

        {aosToCompare.length < 2 ? (
          <div className="text-center text-textSecondary text-lg py-10">Sélectionnez au moins 2 AO pour lancer la comparaison.</div>
        ) : (
          <div className="space-y-10">
            <div>
              <h3 className="text-2xl font-semibold text-primary mb-4">Tableau comparatif</h3>
              <DataTable columns={columns} data={aosToCompare} />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-primary mb-4">Radar des Notes</h3>
              <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6">
                <Radar data={radarData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-primary mb-4">Comparaison des Prix</h3>
              <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
                <Bar
                  data={prixData}
                  options={{
                    responsive: true,
                    indexAxis: 'y',
                    plugins: { legend: { position: 'top' } },
                    scales: {
                      x: { beginAtZero: true, title: { display: true, text: 'Montant (€)' } },
                    },
                  }}
                />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-primary mb-4">Timeline des Appels d'Offres</h3>
              <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
                <Bar
                  data={timelineData}
                  options={{
                    responsive: true,
                    indexAxis: 'y',
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (ctx: any) => {
                            const ao = aosToCompare[ctx.dataIndex];
                            const d1 = ao.date_emission ? dayjs(ao.date_emission).format('DD/MM/YYYY') : '?';
                            const d2 = ao.date_reponse ? dayjs(ao.date_reponse).format('DD/MM/YYYY') : '?';
                            const d3 = ao.date_attribution ? dayjs(ao.date_attribution).format('DD/MM/YYYY') : '?';
                            return `Émission: ${d1} | Réponse: ${d2} | Attribution: ${d3} | Durée: ${ctx.parsed.x} jours`;
                          },
                        },
                      },
                    },
                    scales: {
                      x: { beginAtZero: true, title: { display: true, text: 'Durée (jours)' } },
                    },
                  }}
                />
                <ul className="mt-4 space-y-2 text-sm text-textSecondary">
                  {aosToCompare.map((ao: any, idx: number) => (
                    <li key={ao._id || idx}>
                      <strong className="text-text">{ao.nom_ao}</strong> :
                      {ao.date_emission && <> Émission <strong className="text-text">{dayjs(ao.date_emission).format('DD/MM/YYYY')}</strong> |</>}
                      {ao.date_reponse && <> Réponse <strong className="text-text">{dayjs(ao.date_reponse).format('DD/MM/YYYY')}</strong> |</>}
                      {ao.date_attribution && <> Attribution <strong className="text-text">{dayjs(ao.date_attribution).format('DD/MM/YYYY')}</strong></>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="text-right space-x-4">
              <button className="px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-opacity-90 transition-colors">Exporter PDF</button>
              <button className="px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-opacity-90 transition-colors">Exporter PNG</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparaisonAOPage; 