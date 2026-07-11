'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { nextSortDirection, sortRows, type SortDirection, type SortableValue } from '@/lib/table-sort';
import { SortableColumnHeader } from '@/components/ui/SortableColumnHeader';
import { TableRecordCount } from '@/components/ui/TableRecordCount';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  sortValue?: (row: T) => SortableValue;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  countLabels = { singular: 'registro', plural: 'registros' },
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  caption?: string;
  countLabels?: { singular: string; plural: string };
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(null);

  const sortedRows = useMemo(() => {
    if (!sortKey || !sortDirection) return rows;

    const column = columns.find((entry) => entry.key === sortKey);
    if (!column?.sortValue) return rows;

    return sortRows(rows, column.sortValue, sortDirection);
  }, [columns, rows, sortDirection, sortKey]);

  function handleSort(columnKey: string) {
    const next = nextSortDirection(sortKey, sortDirection, columnKey);
    setSortKey(next.key);
    setSortDirection(next.direction);
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="bg-slate-900/70 text-left text-slate-300">
            {columns.map((col) => (
              <th key={col.key} scope="col" className={`px-3 py-2 font-medium ${col.className ?? ''}`}>
                {col.sortValue ? (
                  <SortableColumnHeader
                    label={col.header}
                    direction={sortKey === col.key ? sortDirection : null}
                    onClick={() => handleSort(col.key)}
                  />
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, i) => (
            <tr key={rowKey(row, i)} className="border-t border-slate-800/80 text-slate-200">
              {columns.map((col) => (
                <td key={col.key} className={`px-3 py-2 ${col.className ?? ''}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-slate-800/80 px-3 py-2">
        <TableRecordCount
          shown={sortedRows.length}
          total={rows.length}
          singular={countLabels.singular}
          plural={countLabels.plural}
        />
      </div>
    </div>
  );
}
