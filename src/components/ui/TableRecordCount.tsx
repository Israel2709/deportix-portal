export function TableRecordCount({
  shown,
  total,
  singular,
  plural,
  className = '',
}: {
  shown: number;
  total: number;
  singular: string;
  plural: string;
  className?: string;
}) {
  const text =
    shown === total
      ? `${total} ${total === 1 ? singular : plural}`
      : `Mostrando ${shown} ${shown === 1 ? singular : plural} de ${total} ${total === 1 ? singular : plural}`;

  return <p className={`text-xs text-slate-500 ${className}`}>{text}</p>;
}
