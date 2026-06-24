import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/50 p-5 ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-lg font-semibold text-slate-100">{children}</h2>;
}

type CoverageLevel = 'available' | 'partial' | 'none';

const COVERAGE_STYLES: Record<CoverageLevel, { label: string; className: string }> = {
  available: { label: 'Disponible', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  partial: { label: 'Cobertura parcial', className: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  none: { label: 'Sin datos cargados aún', className: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
};

export function CoverageBadge({ level }: { level: CoverageLevel }) {
  const style = COVERAGE_STYLES[level];
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.className}`}>
      {style.label}
    </span>
  );
}

/** Map a coverage object to an overall level: all → available, some → partial, none → none. */
export function coverageLevel(coverage: {
  teams: boolean;
  matches: boolean;
  standings: boolean;
}): CoverageLevel {
  const flags = [coverage.teams, coverage.matches, coverage.standings];
  const on = flags.filter(Boolean).length;
  if (on === 0) return 'none';
  if (on === flags.length) return 'available';
  return 'partial';
}

export function ResourceDot({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
      <span
        aria-hidden
        className={`inline-block h-2 w-2 rounded-full ${on ? 'bg-emerald-400' : 'bg-slate-600'}`}
      />
      {label}
    </span>
  );
}

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="bg-slate-900/70 text-left text-slate-300">
            {columns.map((col) => (
              <th key={col.key} scope="col" className={`px-3 py-2 font-medium ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
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
    </div>
  );
}
