'use client';

import { useFormula1CircuitsQuery } from '@/lib/query/formula-1/hooks';
import { Formula1EntityDetail } from './Formula1EntityDetail';

export function Formula1CircuitDetail({ circuitId }: { circuitId: string }) {
  const query = useFormula1CircuitsQuery({ id: circuitId });
  const item = query.data[0] ?? null;

  return (
    <Formula1EntityDetail
      title={item?.name ?? 'Circuito'}
      subtitle={circuitId}
      loading={query.loading}
      error={query.error}
      isEmpty={!item}
      onRetry={query.reload}
      emptyTitle="Circuito no encontrado"
      rows={
        item
          ? [
              { label: 'ID', value: item.id },
              { label: 'Nombre', value: item.name },
              { label: 'País', value: item.country ?? '—' },
              { label: 'Imagen', value: item.image ?? '—' },
            ]
          : []
      }
    />
  );
}
