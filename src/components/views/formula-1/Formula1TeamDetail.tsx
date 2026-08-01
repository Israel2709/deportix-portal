'use client';

import { useFormula1TeamsQuery } from '@/lib/query/formula-1/hooks';
import { Formula1EntityDetail } from './Formula1EntityDetail';

export function Formula1TeamDetail({ teamId }: { teamId: string }) {
  const query = useFormula1TeamsQuery({ id: teamId });
  const item = query.data[0] ?? null;

  return (
    <Formula1EntityDetail
      title={item?.name ?? 'Equipo'}
      subtitle={teamId}
      loading={query.loading}
      error={query.error}
      isEmpty={!item}
      onRetry={query.reload}
      emptyTitle="Equipo no encontrado"
      rows={
        item
          ? [
              { label: 'ID', value: item.id },
              { label: 'Nombre', value: item.name },
              { label: 'Logo', value: item.logo ?? '—' },
            ]
          : []
      }
    />
  );
}
