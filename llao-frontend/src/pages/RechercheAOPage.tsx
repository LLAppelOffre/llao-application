import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DocumentTextIcon, UserCircleIcon, ArrowDownTrayIcon, ChatBubbleLeftRightIcon, CalendarDaysIcon, ExclamationTriangleIcon, CheckCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';

const formatDate = (dateStr: string | number | undefined) => {
  if (!dateStr) return '-';
  const d = new Date(typeof dateStr === 'number' ? dateStr : (typeof dateStr === 'string' && !isNaN(Number(dateStr))) ? Number(dateStr) : dateStr);
  return d.toLocaleDateString('fr-FR');
};

const RechercheAOPage: React.FC = () => {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedAO, setSelectedAO] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any | null>(null);

  // Autocomplétion
  useEffect(() => {
    if (!query || query.length < 2 || !token) {
      setSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`/appels_offres/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Erreur recherche AO');
        const data = await res.json();
        setSuggestions(data);
      } catch (err: any) {
        setSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [query, token]);

  // Charger la fiche AO sélectionnée
  const handleSelectAO = async (ao: any) => {
    setLoading(true);
    setError(null);
    setSelectedAO(null);
    setReport(null);
    try {
      const res = await fetch(`/appels_offres/${ao._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur chargement fiche AO');
      const data = await res.json();
      setSelectedAO(data);
      // Charger le rapport IA associé si possible
      const reportRes = await fetch(`/reports/by-ao/${ao._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (reportRes.ok) {
        const contentType = reportRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const reportData = await reportRes.json();
          setReport(reportData);
        } else {
          setReport(null); // Pas de rapport IA disponible
        }
      } else {
        setReport(null); // Pas de rapport IA disponible
      }
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 dark:bg-dark-backgroundSecondary">
        <h1 className="text-2xl font-title font-bold mb-6 text-primary dark:text-dark-primary">Recherche AO</h1>
        <div className="relative max-w-md mb-6">
          <input
            type="text"
            placeholder="Rechercher un AO par nom..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow dark:bg-dark-background dark:border-dark-border dark:text-dark-text"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-border rounded-lg mt-1 shadow-lg dark:bg-dark-background dark:border-dark-border">
              {suggestions.map(s => (
                <li key={s._id}
                    className="px-4 py-2 cursor-pointer hover:bg-backgroundSecondary dark:hover:bg-dark-backgroundSecondary"
                    onMouseDown={e => { e.preventDefault(); setQuery(s.nom_ao); setSuggestions([]); handleSelectAO(s); }}>
                  {s.nom_ao}
                </li>
              ))}
            </ul>
          )}
        </div>
        {loading && <div className="text-center py-10">Chargement...</div>}
        {error && <div className="text-center py-10 text-error dark:text-dark-error">{error}</div>}
        {selectedAO && (
          <div className="bg-backgroundSecondary rounded-lg shadow p-6 mt-6 border border-border dark:bg-dark-background dark:border-dark-border">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
              <div>
                <h3 className="text-xl font-bold font-title text-primary dark:text-dark-primary mb-1 flex items-center gap-2">
                  <DocumentTextIcon className="w-6 h-6 inline-block text-primary dark:text-dark-primary" />
                  {selectedAO.nom_ao}
                </h3>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">
                  <span className="font-semibold">Catégorie :</span> {selectedAO.categorie} | <span className="font-semibold">Pôle :</span> {selectedAO.pole}
                </div>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">
                  <span className="font-semibold">Statut :</span> <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedAO.statut === 'Gagné' ? 'bg-green-600 text-white' :
                    selectedAO.statut === 'Perdu' ? 'bg-red-600 text-white' :
                    'bg-yellow-400 text-text'
                  }`}>{selectedAO.statut}</span>
                </div>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">
                  <span className="font-semibold">Date émission :</span> {formatDate(selectedAO.date_emission)} | <span className="font-semibold">Date réponse :</span> {formatDate(selectedAO.date_reponse)}
                </div>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">
                  <span className="font-semibold">Année/Trimestre :</span> {selectedAO.annee_trimestre}
                </div>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">
                  <span className="font-semibold">Fichier :</span> {selectedAO.file_name ? (
                    <a href={`/files/${selectedAO.file_name}`} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-dark-primary underline flex items-center gap-1"><ArrowDownTrayIcon className="w-4 h-4 inline-block" />{selectedAO.file_name}</a>
                  ) : 'Non disponible'}
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <div className="text-3xl font-bold text-primary dark:text-dark-primary">{selectedAO.score_client || '--'}<span className="text-base font-normal text-textSecondary dark:text-dark-textSecondary">/100</span></div>
                <div className="text-xs text-textSecondary dark:text-dark-textSecondary">Score client</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{selectedAO.score_gagnant || '--'}<span className="text-base font-normal text-textSecondary dark:text-dark-textSecondary">/100</span></div>
                <div className="text-xs text-textSecondary dark:text-dark-textSecondary">Score gagnant</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <h4 className="font-semibold text-text dark:text-dark-text mb-2">Détails financiers</h4>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">Prix client : <span className="font-bold text-primary dark:text-dark-primary">{selectedAO.prix_client} €</span></div>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">Prix gagnant : <span className="font-bold text-primary dark:text-dark-primary">{selectedAO.prix_gagnant} €</span></div>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">Positionnement prix : <span className="font-bold">{selectedAO.positionnement_prix}</span></div>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">Écart prix : <span className="font-bold">{selectedAO.ecart_prix} €</span></div>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">Délai (jours) : <span className="font-bold">{selectedAO.delai_jours}</span> ({selectedAO.tranche_delai})</div>
              </div>
              <div>
                <h4 className="font-semibold text-text dark:text-dark-text mb-2">Notes & Critères</h4>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">Note technique : <span className="font-bold">{selectedAO.note_technique}</span> ({selectedAO.tranche_note_technique})</div>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">Note prix : <span className="font-bold">{selectedAO.note_prix}</span> ({selectedAO.tranche_prix})</div>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">Création : <span className="font-bold">{selectedAO.creation}</span></div>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">Équipe : <span className="font-bold">{selectedAO.equipe}</span></div>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">Planification : <span className="font-bold">{selectedAO.planification}</span></div>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">RSE : <span className="font-bold">{selectedAO.rse}</span></div>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">Écart score : <span className="font-bold">{selectedAO.ecart_score}</span></div>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-semibold text-text dark:text-dark-text mb-2 flex items-center gap-2"><UserCircleIcon className="w-5 h-5" />Équipe projet</h4>
              {selectedAO.equipe_projet && selectedAO.equipe_projet.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-text dark:text-dark-text">
                  {selectedAO.equipe_projet.map((m: any, i: number) => (
                    <li key={i}><span className="font-medium">{m.nom}</span> — {m.role}</li>
                  ))}
                </ul>
              ) : <div className="text-textSecondary dark:text-dark-textSecondary">Non renseigné</div>}
            </div>
            <div className="mt-6">
              <h4 className="font-semibold text-text dark:text-dark-text mb-2 flex items-center gap-2"><ChatBubbleLeftRightIcon className="w-5 h-5" />Commentaires IA</h4>
              <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">{selectedAO.commentaires_ia || 'Aucun commentaire.'}</div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-text dark:text-dark-text mb-2 flex items-center gap-2"><CalendarDaysIcon className="w-5 h-5" />Dates</h4>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">Création : {formatDate(selectedAO.date_creation?.$date || selectedAO.date_creation)}</div>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">Dernière mise à jour : {formatDate(selectedAO.date_derniere_maj?.$date || selectedAO.date_derniere_maj)}</div>
              </div>
              <div>
                <h4 className="font-semibold text-text dark:text-dark-text mb-2 flex items-center gap-2"><ExclamationTriangleIcon className="w-5 h-5" />Raison de perte</h4>
                <div className="text-sm text-textSecondary dark:text-dark-textSecondary mb-1">{selectedAO.raison_perte || 'Non renseigné ou non concerné.'}</div>
              </div>
            </div>
            {/* Bloc rapport IA */}
            {report ? (
              <div className="mt-8 p-6 rounded-xl bg-white border border-border shadow dark:bg-dark-background dark:border-dark-border">
                <h3 className="text-xl font-bold text-primary dark:text-dark-primary mb-4 flex items-center gap-2"><LightBulbIcon className="w-6 h-6" />Rapport IA</h3>
                <div className="mb-2 text-sm text-textSecondary dark:text-dark-textSecondary"><span className="font-semibold">Nom du rapport :</span> {report.report_name}</div>
                <div className="mb-2 text-sm text-textSecondary dark:text-dark-textSecondary"><span className="font-semibold">Créé le :</span> {formatDate(report.created_at?.$date || report.created_at)}</div>
                {report.ia_analysis?.diagnostic && (
                  <div className="mb-4 p-4 bg-backgroundSecondary rounded-lg border-l-4 border-primary dark:bg-dark-backgroundSecondary dark:border-dark-primary">
                    <span className="font-semibold text-primary dark:text-dark-primary mb-1 flex items-center gap-1"><CheckCircleIcon className="w-5 h-5" />Diagnostic IA</span>
                    <div className="text-text dark:text-dark-text text-sm">{report.ia_analysis.diagnostic}</div>
                  </div>
                )}
                {report.ia_analysis?.recommandations?.length > 0 && (
                  <div className="mb-4 p-4 bg-backgroundSecondary rounded-lg border-l-4 border-green-600 dark:bg-dark-backgroundSecondary dark:border-green-400">
                    <span className="font-semibold text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">✅ Recommandations IA</span>
                    <ul className="list-disc list-inside text-text dark:text-dark-text text-sm mt-2">
                      {report.ia_analysis.recommandations.map((rec: string, i: number) => <li key={i}>{rec}</li>)}
                    </ul>
                  </div>
                )}
                {report.ia_analysis?.alertes?.length > 0 && (
                  <div className="mb-4 p-4 bg-red-50 rounded-lg border-l-4 border-error dark:bg-red-900/20 dark:border-dark-error">
                    <span className="font-semibold text-error dark:text-dark-error mb-1 flex items-center gap-1">🚨 Alertes</span>
                    <ul className="list-disc list-inside text-error dark:text-dark-error text-sm mt-2">
                      {report.ia_analysis.alertes.map((al: string, i: number) => <li key={i}>{al}</li>)}
                    </ul>
                  </div>
                )}
                {report.ia_analysis?.insights_cles?.length > 0 && (
                  <div className="mb-4 p-4 bg-backgroundSecondary rounded-lg border-l-4 border-primary dark:bg-dark-backgroundSecondary dark:border-dark-primary">
                    <span className="font-semibold text-primary dark:text-dark-primary mb-1 flex items-center gap-1">💡 Insights clés</span>
                    <ul className="list-disc list-inside text-text dark:text-dark-text text-sm mt-2">
                      {report.ia_analysis.insights_cles.map((ins: string, i: number) => <li key={i}>{ins}</li>)}
                    </ul>
                  </div>
                )}
                {report.ia_analysis?.analyse_des_scores && (
                  <div className="mb-4 p-4 bg-backgroundSecondary rounded-lg border-l-4 border-primary dark:bg-dark-backgroundSecondary dark:border-dark-primary">
                    <span className="font-semibold text-primary dark:text-dark-primary mb-1 flex items-center gap-1">📊 Analyse des scores</span>
                    <div className="text-text dark:text-dark-text text-sm">{report.ia_analysis.analyse_des_scores}</div>
                  </div>
                )}
                {/* Résumé KPIs */}
                {report.result_summary && (
                  <div className="mb-4 p-4 bg-backgroundSecondary rounded-lg border-l-4 border-green-600 dark:bg-dark-backgroundSecondary dark:border-green-400">
                    <span className="font-semibold text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">📈 KPIs du rapport</span>
                    <ul className="list-disc list-inside text-text dark:text-dark-text text-sm mt-2">
                      <li><b>Nombre total :</b> {report.result_summary.nombre_total}</li>
                      <li><b>Gagnés :</b> {report.result_summary.nombre_gagnes}</li>
                      <li><b>Perdus :</b> {report.result_summary.nombre_perdus}</li>
                      <li><b>En cours :</b> {report.result_summary.nombre_en_cours}</li>
                      <li><b>Score moyen technique :</b> {report.result_summary.score_moyen_technique}</li>
                      <li><b>Score moyen prix :</b> {report.result_summary.score_moyen_prix}</li>
                      <li><b>Taux de réussite :</b> {report.result_summary.taux_reussite}</li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-8 text-center text-textSecondary dark:text-dark-textSecondary italic">Pas de rapport IA disponible pour cet AO.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RechercheAOPage; 