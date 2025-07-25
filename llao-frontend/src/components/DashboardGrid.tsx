import React, { useState, useEffect, useRef } from 'react';
import GridLayout, { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { ArrowsRightLeftIcon, ArrowsUpDownIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon, ArrowsPointingOutIcon, DocumentTextIcon, InformationCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import NivoBarChart from './NivoBarChart';
import NivoPieChart from './NivoPieChart';
import NivoLineChart from './NivoLineChart';
import NivoBoxPlot from './NivoBoxPlot';
import NivoScatterPlot from './NivoScatterPlot';
import { DataTable, DataTableColumn } from './DataTable';
import type { FilterState } from '../hooks/useGraphData';
import html2canvas from 'html2canvas';
import Plot from 'react-plotly.js';
import { ExclamationCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

// Types pour widget dashboard
export type WidgetType = 'bar' | 'pie' | 'line' | 'box' | 'scatter' | 'table' | 'section' | 'plotly';
export interface DashboardWidget {
  id: string; // C'est le graph_id (type de graphique)
  instance_id: string; // L'identifiant unique de CET exemplaire du widget
  type: WidgetType;
  title: string;
  data?: any;
  tableColumns?: DataTableColumn[];
  tableData?: any[];
  size?: 'third' | 'half' | 'two-thirds' | 'full';
  height?: 'small' | 'medium' | 'large';
  order?: number;
  filtres?: any;
  customComponent?: React.ReactNode;
  description?: string;
  customTitle?: string;
  text?: string;
  plotProps?: any;
  // Propriétés de la grille
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

interface DashboardGridProps {
  widgets: DashboardWidget[];
  layouts: { [key: string]: Layout[] }; // La disposition est maintenant une prop
  onLayoutChange: (layout: Layout[], allLayouts: { [key: string]: Layout[] }) => void; // Le parent gère le changement
  editable?: boolean;
  globalFilters?: FilterState;
  onRemoveWidget?: (widgetId: string) => void;
  dashboardId: string;
  token: string | null;
}

// Mapping des composants de graphiques (Nivo)
const graphComponentMap: Record<string, React.FC<{ filters: FilterState }>> = {
  'pie_gagne_perdu': ({ filters }) => {
    const data = [
      { id: 'Gagné', value: 42 },
      { id: 'Perdu', value: 28 },
      { id: 'In progress', value: 10 },
    ].filter(row =>
      filters.statuts?.length === 0 || filters.statuts?.includes(row.id)
    );
    return (
      <NivoPieChart
        data={data}
        colors={["#00B050", "#D32F2F", "#F4B084"]}
        height={350}
      />
    );
  },
  'bar_categorie': ({ filters }) => {
    const raw = [
      { categorie: "Bâtiment", Gagné: 10, Perdu: 5 },
      { categorie: "Informatique", Gagné: 8, Perdu: 7 },
      { categorie: "Services", Gagné: 12, Perdu: 9 },
    ];
    const categories = filters.categories?.length ? filters.categories : ["Bâtiment", "Informatique", "Services"];
    const data = raw.filter(row => categories.includes(row.categorie));
    return (
      <NivoBarChart
        data={data}
        keys={["Gagné", "Perdu"]}
        indexBy="categorie"
        colors={["#00B050", "#D32F2F"]}
        height={350}
        axisBottomLegend="Catégorie"
        axisLeftLegend="Nombre d'AO"
      />
    );
  },
  'pie_pole': ({ filters }) => {
    const data = [
      { id: "Pôle A", value: 20 },
      { id: "Pôle B", value: 30 },
      { id: "Pôle C", value: 50 },
    ].filter(row =>
      filters.poles?.length === 0 || filters.poles?.includes(row.id)
    );
    return (
      <NivoPieChart
        data={data}
        colors={["#00B050", "#37966F", "#A5D6A7"]}
        height={350}
      />
    );
  },
  'bar_pole': ({ filters }) => {
    const raw = [
      { pole: "Pôle A", Gagné: 15, Perdu: 8 },
      { pole: "Pôle B", Gagné: 12, Perdu: 10 },
      { pole: "Pôle C", Gagné: 15, Perdu: 10 },
    ];
    const poles = filters.poles?.length ? filters.poles : ["Pôle A", "Pôle B", "Pôle C"];
    const data = raw.filter(row => poles.includes(row.pole));
    return (
      <NivoBarChart
        data={data}
        keys={["Gagné", "Perdu"]}
        indexBy="pole"
        colors={["#00B050", "#D32F2F"]}
        height={350}
        axisBottomLegend="Pôle"
        axisLeftLegend="Nombre d'AO"
      />
    );
  },
  'bar_delai_categorie': ({ filters }) => {
    const raw = [
      { categorie: "Bâtiment", delai: 8 },
      { categorie: "Informatique", delai: 12 },
      { categorie: "Services", delai: 6 },
      { categorie: "Transport", delai: 15 },
    ];
    const categories = filters.categories?.length ? filters.categories : ["Bâtiment", "Informatique", "Services", "Transport"];
    const data = raw.filter(row => categories.includes(row.categorie));
    return (
      <NivoBarChart
        data={data}
        keys={["delai"]}
        indexBy="categorie"
        colors={["#4472C4"]}
        height={350}
        axisBottomLegend="Catégorie"
        axisLeftLegend="Délai moyen (jours)"
      />
    );
  },
  'notes_distribution': ({ filters }) => {
    const data = [
      { note: 7, count: 5 },
      { note: 8, count: 12 },
      { note: 9, count: 18 },
      { note: 10, count: 8 },
    ];
    return (
      <NivoBarChart
        data={data}
        keys={["count"]}
        indexBy="note"
        colors={["#4CAF50"]}
        height={350}
        axisBottomLegend="Note"
        axisLeftLegend="Nombre d'AO"
      />
    );
  },
  'prix_vs_notes': ({ filters }) => {
    const data = [
      { id: "Bâtiment", data: [{ x: 50000, y: 8.5 }] },
      { id: "Informatique", data: [{ x: 75000, y: 9.2 }] },
      { id: "Services", data: [{ x: 120000, y: 7.8 }] },
      { id: "Transport", data: [{ x: 30000, y: 9.5 }] },
    ].filter(row =>
      filters.categories?.length === 0 || filters.categories?.includes(row.id)
    );
    return (
      <NivoScatterPlot
        data={data}
        colors={["#2196F3"]}
        height={350}
        axisBottomLegend="Prix client"
        axisLeftLegend="Note technique"
      />
    );
  },
  'comparaison_scores': ({ filters }) => {
    const data = [
      { id: "Bâtiment", data: [{ x: 85, y: 92 }] },
      { id: "Informatique", data: [{ x: 78, y: 88 }] },
      { id: "Services", data: [{ x: 92, y: 95 }] },
      { id: "Transport", data: [{ x: 88, y: 91 }] },
    ].filter(row =>
      filters.categories?.length === 0 || filters.categories?.includes(row.id)
    );
    return (
      <NivoScatterPlot
        data={data}
        colors={["#FF9800"]}
        height={350}
        axisBottomLegend="Score client"
        axisLeftLegend="Score gagnant"
      />
    );
  },
  // Ajouter d'autres graphiques selon les besoins...
};

// Options de taille et hauteur avec Heroicons
const sizeOptions = [
  { key: 'third', label: '1/3', icon: <ArrowsRightLeftIcon className="w-5 h-5" /> },
  { key: 'half', label: '1/2', icon: <ArrowsRightLeftIcon className="w-5 h-5" /> },
  { key: 'two-thirds', label: '2/3', icon: <ArrowsRightLeftIcon className="w-5 h-5" /> },
  { key: 'full', label: 'Pleine largeur', icon: <ArrowsRightLeftIcon className="w-5 h-5" /> },
];
const heightOptions = [
  { key: 'small', label: 'Basse', icon: <ArrowsUpDownIcon className="w-5 h-5" /> },
  { key: 'medium', label: 'Moyenne', icon: <ArrowsUpDownIcon className="w-5 h-5" /> },
  { key: 'large', label: 'Grande', icon: <ArrowsUpDownIcon className="w-5 h-5" /> },
];

// Mapping des tailles pour Plotly/DataTable
const sizeToWidth: Record<string, number> = {
  'third': 400,
  'half': 520,
  'two-thirds': 700,
  'full': 900,
};
const heightToPx: Record<string, number> = {
  'small': 600,    // encore plus grand pour éviter le rognage
  'medium': 700,
  'large': 1000,
};

// Remplacer le composant principal par la grille responsive
const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardGrid: React.FC<DashboardGridProps> = ({
  widgets,
  layouts, // props
  onLayoutChange, // props
  editable,
  globalFilters = { categories: [], statuts: [], poles: [], dateDebut: '', dateFin: '' },
  onRemoveWidget,
  dashboardId,
  token
}) => {
  const [localWidgets, setLocalWidgets] = useState<DashboardWidget[]>([]);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionText, setSectionText] = useState('');
  const gridRef = useRef<any>(null);

  // Générer un layout initial à partir des widgets
  useEffect(() => {
    setLocalWidgets(widgets);
    const initialLayout = widgets.map((w, i) => ({
      i: w.instance_id, // Utiliser instance_id
      x: (i % 2) * 6,
      y: Math.floor(i / 2) * 4,
      w: 6, // Default width
      h: 6, // Default height
      minW: 6, // Ensure minimum width
      minH: 6, // Ensure minimum height
      maxW: 12, // Max width for larger screens
      maxH: 12, // Max height for larger screens
    }));
    // setLayouts({ lg: initialLayout }); // This line was removed as per the new_code, as the layouts prop is now directly passed.
  }, [widgets, editable]);

  // Renommage inline (double-clic)
  const handleTitleDoubleClick = (id: string, current: string) => {
    setEditingTitleId(id);
    setEditingTitle(current);
  };
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => setEditingTitle(e.target.value);
  const handleTitleBlur = (id: string) => {
    setLocalWidgets(ws => ws.map(w => w.id === id ? { ...w, customTitle: editingTitle } : w));
    setEditingTitleId(null);
    // Appel backend pour sauvegarder le titre
    fetch(`/dashboards/${dashboardId}/update_graphique_titre`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ graph_id: id, customTitle: editingTitle })
    });
  };

  // Edition inline des sections de texte (double-clic)
  const handleSectionDoubleClick = (id: string, current: string) => {
    setEditingSectionId(id);
    setSectionText(current);
  };
  const handleSectionBlur = (id: string) => {
    setLocalWidgets(ws => ws.map(w => w.id === id ? { ...w, text: sectionText } : w));
    setEditingSectionId(null);
    // Appel backend pour sauvegarder le texte
    fetch(`/dashboards/${dashboardId}/update_graphique_texte`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ graph_id: id, text: sectionText })
    });
  };

  // Export du dashboard complet
  const handleExportDashboard = async () => {
    if (!gridRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(gridRef.current, { backgroundColor: null });
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard.png`;
    link.click();
  };

  // Rendu d'un widget avec les bonnes données
  const renderWidgetContent = (widget: DashboardWidget) => {
    if (widget.type === 'section') {
      if (editingSectionId === widget.id) {
        return (
          <div className="p-2">
            <textarea
              value={sectionText}
              onChange={e => setSectionText(e.target.value)}
              onBlur={() => handleSectionBlur(widget.id)}
              autoFocus
              rows={5}
              className="w-full resize-vertical font-body text-sm rounded-lg border border-borderLightGray focus:ring-2 focus:ring-borderGray focus:border-transparent"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={() => handleSectionBlur(widget.id)} className="flex items-center gap-1 bg-green-600 text-white font-semibold py-1 px-3 rounded-lg hover:bg-green-700 transition-colors"><CheckCircleIcon className="w-5 h-5" /> Valider</button>
              <button onClick={() => setEditingSectionId(null)} className="flex items-center gap-1 bg-gray-200 text-gray-800 font-semibold py-1 px-3 rounded-lg hover:bg-gray-300 transition-colors"><XCircleIcon className="w-5 h-5" /> Annuler</button>
            </div>
          </div>
        );
      }
      return (
        <div className="p-2 min-h-[60px] flex flex-col justify-center items-center text-center">
            {widget.text ? (
                <div className="whitespace-pre-line font-body text-sm" onDoubleClick={() => handleSectionDoubleClick(widget.id, widget.text || '')}>
                    {widget.text}
                </div>
            ) : (
                <div className="text-textSecondary italic">
                    <DocumentTextIcon className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p>Cette section est vide.</p>
                    <p>Cliquez sur le bouton "Modifier" pour y ajouter du contenu.</p>
                </div>
            )}
        </div>
      );
    }
    if (widget.customComponent) {
      return widget.customComponent;
    }
    const GraphComponent = graphComponentMap[widget.id];
    // Ajout d'un conteneur avec id pour export PNG
    if (GraphComponent) {
      return (
        <div id={`widget-graph-${widget.id}`} className="relative">
          <GraphComponent filters={globalFilters} />
        </div>
      );
    }
    if (widget.type === 'table' && widget.tableColumns && widget.tableData) {
      const tableHeight = heightToPx[widget.height || 'medium'];
      return (
        <div className="w-full h-full overflow-auto">
          <DataTable
            columns={widget.tableColumns}
            data={widget.tableData}
            pageSize={8}
          />
        </div>
      );
    }
    // Plotly (si widget.type === 'plotly')
    if (widget.type === 'plotly' && widget.plotProps) {
      return (
        <div id={`widget-graph-${widget.id}`} className="relative">
          <Plot {...widget.plotProps} />
        </div>
      );
    }
    return <div className="graph-not-supported">Graphique non supporté</div>;
  };

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button onClick={handleExportDashboard} className="bg-primary text-white rounded-md px-4 py-2 font-body font-medium transition hover:bg-hover hover:text-text shadow">
          Exporter le dashboard complet
        </button>
      </div>
      <div ref={gridRef} className="dashboard-grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts} // Utilise la prop
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={40}
          isDraggable={!!editable}
          isResizable={!!editable}
          onLayoutChange={onLayoutChange} // Appelle la fonction du parent
          compactType="vertical"
        >
          {widgets.map((widget) => (
            <div key={widget.instance_id} data-grid={layouts.lg?.find(l => l.i === widget.instance_id) || { w: 6, h: 6, x: 0, y: 0, i: widget.instance_id }} className="bg-white dark:bg-dark-backgroundSecondary rounded-2xl shadow-lg p-6 flex flex-col transition-all duration-200 hover:shadow-2xl hover:scale-[1.02] w-full">
              {/* Titre editable */}
              <div className="flex items-center mb-2">
                {editingTitleId === widget.id ? (
                  <input
                    value={editingTitle}
                    onChange={handleTitleChange}
                    onBlur={() => handleTitleBlur(widget.id)}
                    autoFocus
                    className="font-title text-lg md:text-xl font-bold text-primary dark:text-dark-primary mb-2 truncate border-b border-primary focus:outline-none"
                  />
                ) : (
                  <h2
                    className="font-title text-lg md:text-xl font-bold text-primary dark:text-dark-primary mb-2 truncate cursor-pointer"
                    onDoubleClick={() => handleTitleDoubleClick(widget.id, widget.customTitle || widget.title)}
                  >
                    {widget.customTitle || widget.title}
                  </h2>
                )}
              </div>
              {/* Section de texte editable */}
              {widget.type === 'section' ? (
                editingSectionId === widget.id ? (
                  <textarea
                    value={sectionText}
                    onChange={e => setSectionText(e.target.value)}
                    onBlur={() => handleSectionBlur(widget.id)}
                    autoFocus
                    className="bg-backgroundSecondary dark:bg-dark-background rounded-xl p-4 text-text dark:text-dark-text text-base font-body w-full resize-vertical"
                  />
                ) : (
                  <div
                    className="whitespace-pre-line font-body text-sm cursor-pointer"
                    onDoubleClick={() => handleSectionDoubleClick(widget.id, widget.text || '')}
                  >
                    {widget.text || <span className="italic text-gray-400">Double-cliquez pour éditer cette section</span>}
                  </div>
                )
              ) : (
                // Rendu du widget graphique/table
                <div className="flex-1 flex flex-col">
                  {renderWidgetContent(widget)}
                </div>
              )}
              {/* Bouton suppression */}
              {editable && onRemoveWidget && (
                <button onClick={() => onRemoveWidget(widget.instance_id)} className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors">
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
};

export default DashboardGrid; 