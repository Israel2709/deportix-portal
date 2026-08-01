'use client';

import { Card } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';
import { Formula1DetailLayout } from './Formula1DetailLayout';

export function Formula1EntityDetail({
  title,
  subtitle,
  loading,
  error,
  isEmpty,
  onRetry,
  emptyTitle,
  rows,
}: {
  title: string;
  subtitle?: string;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  onRetry: () => void;
  emptyTitle: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <Formula1DetailLayout title={title} subtitle={subtitle}>
      <DataSection
        loading={loading}
        error={error}
        isEmpty={isEmpty}
        onRetry={onRetry}
        emptyTitle={emptyTitle}
      >
        <Card>
          <dl className="grid gap-3 sm:grid-cols-2">
            {rows.map((row) => (
              <div key={row.label}>
                <dt className="text-xs uppercase tracking-wide text-slate-500">{row.label}</dt>
                <dd className="mt-1 break-all text-sm text-slate-100">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </DataSection>
    </Formula1DetailLayout>
  );
}
