import React, { useState } from "react";
import { ArchiveBoxXMarkIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export interface DataTableColumn<T = any> {
  Header: string;
  accessor: keyof T | string;
}

interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  data: T[];
  pageSize?: number;
  loading?: boolean;
  error?: string;
}

function sortData<T>(data: T[], accessor: keyof T | string, direction: "asc" | "desc") {
  return [...data].sort((a, b) => {
    const aValue = a[accessor as keyof T];
    const bValue = b[accessor as keyof T];
    if (aValue == null) return 1;
    if (bValue == null) return -1;
    if (typeof aValue === "number" && typeof bValue === "number") {
      return direction === "asc" ? aValue - bValue : bValue - aValue;
    }
    return direction === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });
}

function getUniqueValues<T>(data: T[], accessor: keyof T | string): string[] {
  const values = data.map(row => row[accessor as keyof T]);
  return Array.from(new Set(values)).filter(v => v != null).map(String);
}

export function DataTable<T = any>({ columns, data, pageSize = 10, loading = false, error }: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (accessor: string) => {
    if (sortBy === accessor) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(accessor);
      setSortDir("asc");
    }
    setPage(0);
  };

  let sortedData = data;
  if (sortBy) {
    sortedData = sortData(data, sortBy, sortDir);
  }
  const pageCount = Math.ceil(sortedData.length / pageSize);
  const pagedData = sortedData.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="bg-backgroundSecondary rounded-xl shadow p-4 my-6 overflow-x-auto dark:bg-dark-backgroundSecondary dark:border dark:border-dark-border">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-textSecondary dark:text-dark-textSecondary animate-fadeIn" aria-live="polite">
          <ExclamationCircleIcon className="w-12 h-12 mb-2" />
          <div className="text-lg font-semibold mb-1">Chargement...</div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-error dark:text-dark-error animate-fadeIn" aria-live="polite">
          <ExclamationCircleIcon className="w-12 h-12 mb-2" />
          <div className="text-lg font-semibold mb-1">Erreur</div>
          <div>{error}</div>
        </div>
      ) : (
        <table className="w-full border-collapse font-body text-[15px] bg-backgroundSecondary dark:bg-dark-backgroundSecondary">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.accessor as string}
                  className={`bg-hover text-text font-semibold py-2 px-2 border-b-2 border-primary text-left select-none transition ${sortBy === col.accessor ? 'text-primary bg-border' : ''} dark:bg-dark-hover dark:text-dark-text dark:border-dark-primary ${sortBy === col.accessor ? 'dark:text-dark-primary dark:bg-dark-border' : ''}`}
                  onClick={() => handleSort(col.accessor as string)}
                >
                  {col.Header}
                  {sortBy === col.accessor && (
                    <span className="ml-1 text-xs text-primary dark:text-dark-primary">{sortDir === 'asc' ? '\u25b2' : '\u25bc'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center text-textSecondary py-16 dark:text-dark-textSecondary animate-fadeIn" aria-live="polite">
                  <ExclamationCircleIcon className="w-12 h-12 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-text mb-2 dark:text-dark-text">Aucun résultat trouvé</h3>
                  <p>Essayez de modifier vos filtres ou votre recherche pour trouver ce que vous cherchez.</p>
                </td>
              </tr>
            ) : (
              pagedData.map((row, i) => (
                <tr 
                  key={i} 
                  className="hover:bg-border animate-fadeIn dark:hover:bg-dark-hover"
                  style={{ animationDelay: `${i * 50}ms`, opacity: 0 }}
                >
                  {columns.map((col) => (
                    <td key={col.accessor as string} className="py-2 px-2 border-b border-border text-text dark:border-dark-border dark:text-dark-text">
                      {row[col.accessor as keyof T] as any}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t border-border dark:border-dark-border">
        <button
          className="bg-hover text-primary border-none rounded px-3 py-1 text-sm cursor-pointer transition hover:bg-secondary disabled:bg-gray-200 disabled:text-textSecondary disabled:cursor-not-allowed dark:bg-dark-hover dark:text-dark-primary dark:hover:bg-dark-border dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
          onClick={() => setPage(0)}
          disabled={page === 0}
        >
          «
        </button>
        <button
          className="bg-hover text-primary border-none rounded px-3 py-1 text-sm cursor-pointer transition hover:bg-secondary disabled:bg-gray-200 disabled:text-textSecondary disabled:cursor-not-allowed dark:bg-dark-hover dark:text-dark-primary dark:hover:bg-dark-border dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          ‹
        </button>
        <span className="text-primary text-sm font-medium dark:text-dark-primary">Page {page + 1} / {pageCount}</span>
        <button
          className="bg-hover text-primary border-none rounded px-3 py-1 text-sm cursor-pointer transition hover:bg-secondary disabled:bg-gray-200 disabled:text-textSecondary disabled:cursor-not-allowed dark:bg-dark-hover dark:text-dark-primary dark:hover:bg-dark-border dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          disabled={page >= pageCount - 1}
        >
          ›
        </button>
        <button
          className="bg-hover text-primary border-none rounded px-3 py-1 text-sm cursor-pointer transition hover:bg-secondary disabled:bg-gray-200 disabled:text-textSecondary disabled:cursor-not-allowed dark:bg-dark-hover dark:text-dark-primary dark:hover:bg-dark-border dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
          onClick={() => setPage(pageCount - 1)}
          disabled={page >= pageCount - 1}
        >
          »
        </button>
      </div>
    </div>
  );
}

export default DataTable; 