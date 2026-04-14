import { useState, useMemo, type ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  emptyIcon?: React.ComponentType<{ className?: string }>;
  compact?: boolean;
  stickyHeader?: boolean;
  className?: string;
  rowClassName?: (row: T, index: number) => string;
  expandedRow?: (row: T) => ReactNode;
}

type SortDir = 'asc' | 'desc' | null;

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data found',
  emptyIcon,
  compact = false,
  stickyHeader = false,
  className = '',
  rowClassName,
  expandedRow,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(new Set());

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return data;
    const arr = [...data];
    arr.sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [data, sortKey, sortDir, columns]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortKey(null); setSortDir(null); }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleExpanded = (key: string | number) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const py = compact ? 'py-2' : 'py-3';
  const px = compact ? 'px-3' : 'px-4';

  if (data.length === 0) {
    return (
      <div className={`rounded-2xl border border-theme/60 bg-[var(--bg-card)] backdrop-blur-xl ${className}`}>
        <EmptyState
          message={emptyMessage}
          icon={emptyIcon as any}
          compact
        />
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-theme/60 bg-[var(--bg-card)] backdrop-blur-xl overflow-hidden ${className}`}>
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full text-left">
          <thead>
            <tr className={`border-b border-theme ${stickyHeader ? 'sticky top-0 z-10 bg-[var(--bg-card)] backdrop-blur-sm' : ''}`}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${px} ${py} text-[10px] font-bold text-theme-tertiary uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer select-none hover:text-theme-secondary transition-colors' : ''
                  } ${col.headerClassName || ''}`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="h-3.5 w-3.5 shrink-0">
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-30" />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-theme/80">
            {sorted.map((row, i) => {
              const key = keyExtractor(row, i);
              const isExpanded = expandedKeys.has(key);
              return (
                <tr
                  key={key}
                  onClick={expandedRow ? () => toggleExpanded(key) : onRowClick ? () => onRowClick(row) : undefined}
                  className={`
                    transition-colors duration-100
                    ${onRowClick || expandedRow ? 'cursor-pointer' : ''}
                    hover:bg-theme-surface/60
                    ${isExpanded ? 'bg-theme-surface/40' : ''}
                    ${rowClassName ? rowClassName(row, i) : ''}
                  `}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`${px} ${py} text-sm ${col.className || ''}`}>
                      {col.render(row, i)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
