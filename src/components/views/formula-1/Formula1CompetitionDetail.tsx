'use client';

import { useFormula1CompetitionsQuery } from '@/lib/query/formula-1/hooks';
import { Formula1EntityDetail } from './Formula1EntityDetail';

export function Formula1CompetitionDetail({ competitionId }: { competitionId: string }) {
  const query = useFormula1CompetitionsQuery({ id: competitionId });
  const item = query.data[0] ?? null;

  return (
    <Formula1EntityDetail
      title={item?.name ?? 'Competición'}
      subtitle={competitionId}
      loading={query.loading}
      error={query.error}
      isEmpty={!item}
      onRetry={query.reload}
      emptyTitle="Competición no encontrada"
      rows={
        item
          ? [
              { label: 'ID', value: item.id },
              { label: 'Nombre', value: item.name },
            ]
          : []
      }
    />
  );
}
