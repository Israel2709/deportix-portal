'use client';

import { Card, SectionTitle } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';
import { formatDateTime } from '@/lib/format';
import { useFormula1RaceQuery, useFormula1RaceRankingsQuery } from '@/lib/query/formula-1/hooks';
import { Formula1DetailLayout } from './Formula1DetailLayout';

export function Formula1RaceDetail({ raceId }: { raceId: string }) {
  const race = useFormula1RaceQuery(raceId);
  const rankings = useFormula1RaceRankingsQuery(raceId);
  const item = race.data;

  return (
    <Formula1DetailLayout
      title={item ? `${item.competition.name} · ${item.type}` : 'Carrera'}
      subtitle={raceId}
    >
      <DataSection
        loading={race.loading}
        error={race.error}
        isEmpty={!item}
        onRetry={race.reload}
        emptyTitle="Carrera no encontrada"
      >
        {item && (
          <Card>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Competición</dt>
                <dd className="mt-1 text-sm text-slate-100">{item.competition.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Circuito</dt>
                <dd className="mt-1 text-sm text-slate-100">
                  {item.circuit.name}
                  {item.circuit.country ? ` · ${item.circuit.country}` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Temporada</dt>
                <dd className="mt-1 text-sm text-slate-100">{item.season}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Estado</dt>
                <dd className="mt-1 text-sm text-slate-100">{item.status}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Fecha (UTC)</dt>
                <dd className="mt-1 text-sm text-slate-100">{formatDateTime(item.date)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Distancia</dt>
                <dd className="mt-1 text-sm text-slate-100">{item.distance ?? '—'}</dd>
              </div>
            </dl>
          </Card>
        )}
      </DataSection>

      <section className="space-y-3">
        <SectionTitle>Resultados</SectionTitle>
        <DataSection
          loading={rankings.loading}
          error={rankings.error}
          isEmpty={rankings.data.length === 0}
          onRetry={rankings.reload}
          emptyTitle="Sin resultados cargados"
        >
          <ul className="space-y-2">
            {rankings.data.map((row) => (
              <li
                key={`${row.position}-${row.driver.id}`}
                className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200"
              >
                P{row.position} · {row.driver.name}
                {row.team?.name ? ` · ${row.team.name}` : ''}
                {row.time ? ` · ${row.time}` : ''}
              </li>
            ))}
          </ul>
        </DataSection>
      </section>
    </Formula1DetailLayout>
  );
}
