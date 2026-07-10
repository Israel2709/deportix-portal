import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Ui';
import { americanFootballTabPath } from '@/lib/american-football-paths';
import { AmericanFootballCheckboxField, AmericanFootballTextField } from './AmericanFootballFormShell';

export function AmericanFootballDetailLayout({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={americanFootballTabPath('contenido')}
            className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
          >
            ← Volver a contenido
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-slate-50">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <Card>{children}</Card>
    </div>
  );
}

export function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-100">{value}</dd>
    </div>
  );
}

export function DetailEditableField({
  label,
  value,
  editing,
  editValue,
  onChange,
  type = 'text',
}: {
  label: string;
  value: ReactNode;
  editing: boolean;
  editValue: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  if (editing) {
    return <AmericanFootballTextField label={label} value={editValue} onChange={onChange} type={type} />;
  }
  return <DetailField label={label} value={value} />;
}

export function DetailEditableCheckbox({
  label,
  value,
  editing,
  checked,
  onChange,
}: {
  label: string;
  value: ReactNode;
  editing: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  if (editing) {
    return <AmericanFootballCheckboxField label={label} checked={checked} onChange={onChange} />;
  }
  return <DetailField label={label} value={value} />;
}
