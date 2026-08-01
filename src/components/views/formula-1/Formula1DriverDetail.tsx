'use client';

import { useFormula1DriversQuery } from '@/lib/query/formula-1/hooks';
import { Formula1EntityDetail } from './Formula1EntityDetail';

export function Formula1DriverDetail({ driverId }: { driverId: string }) {
  const query = useFormula1DriversQuery({ id: driverId });
  const item = query.data[0] ?? null;

  return (
    <Formula1EntityDetail
      title={item?.name ?? 'Piloto'}
      subtitle={driverId}
      loading={query.loading}
      error={query.error}
      isEmpty={!item}
      onRetry={query.reload}
      emptyTitle="Piloto no encontrado"
      rows={
        item
          ? [
              { label: 'ID', value: item.id },
              { label: 'Nombre', value: item.name },
              { label: 'Número', value: item.number != null ? String(item.number) : '—' },
              { label: 'Equipo', value: item.team?.name ?? '—' },
              { label: 'ID equipo', value: item.team?.id ?? '—' },
            ]
          : []
      }
    />
  );
}
