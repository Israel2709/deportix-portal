import type { SortDirection } from '@/lib/table-sort';

export function SortableColumnHeader({
  label,
  direction,
  onClick,
  className = '',
}: {
  label: string;
  direction: SortDirection | null;
  onClick: () => void;
  className?: string;
}) {
  const indicator = direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : '↕';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'}
      className={`inline-flex items-center gap-1 text-left font-medium text-slate-300 hover:text-slate-100 ${className}`}
    >
      <span>{label}</span>
      <span aria-hidden className="text-xs text-slate-500">
        {indicator}
      </span>
    </button>
  );
}
