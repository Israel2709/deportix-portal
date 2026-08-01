'use client';

import Link from 'next/link';
import { Card, SectionTitle } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';
import { formatDateTime } from '@/lib/format';
import { formula1RaceDetailPath } from '@/lib/formula-1-paths';
import {
  useFormula1DriverRankingsQuery,
  useFormula1RacesQuery,
  useFormula1TeamRankingsQuery,
} from '@/lib/query/formula-1/hooks';
import { Formula1DetailLayout } from './Formula1DetailLayout';

export function Formula1SeasonBrowse({ year }: { year: string }) {
  const races = useFormula1RacesQuery({ season: year });
  const drivers = useFormula1DriverRankingsQuery(year);
  const teams = useFormula1TeamRankingsQuery(year);

  return (
    <Formula1DetailLayout title={`Temporada ${year}`} subtitle="Calendario y clasificación">
      <section className="space-y-3">
        <SectionTitle>Calendario</SectionTitle>
        <DataSection
          loading={races.loading}
          error={races.error}
          isEmpty={races.data.length === 0}
          onRetry={races.reload}
          emptyTitle="Sin sesiones"
        >
          <ul className="space-y-2">
            {races.data.map((item) => (
              <li key={item.id}>
                <Link href={formula1RaceDetailPath(item.id)} className="block">
                  <Card className="transition hover:border-blue-500/40">
                    <p className="font-medium text-slate-100">
                      {item.competition.name} · {item.type}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.circuit.name} · {item.status} · {formatDateTime(item.date)}
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </DataSection>
      </section>

      <section className="space-y-3">
        <SectionTitle>Clasificación pilotos</SectionTitle>
        <DataSection
          loading={drivers.loading}
          error={drivers.error}
          isEmpty={drivers.data.length === 0}
          onRetry={drivers.reload}
          emptyTitle="Sin clasificación"
        >
          <ul className="space-y-2">
            {drivers.data.map((row) => (
              <li
                key={`${row.position}-${row.driver.id}`}
                className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200"
              >
                P{row.position} · {row.driver.name}
                {row.team?.name ? ` · ${row.team.name}` : ''} · {row.points ?? 0} pts
              </li>
            ))}
          </ul>
        </DataSection>
      </section>

      <section className="space-y-3">
        <SectionTitle>Clasificación constructores</SectionTitle>
        <DataSection
          loading={teams.loading}
          error={teams.error}
          isEmpty={teams.data.length === 0}
          onRetry={teams.reload}
          emptyTitle="Sin clasificación"
        >
          <ul className="space-y-2">
            {teams.data.map((row) => (
              <li
                key={`${row.position}-${row.team.id}`}
                className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200"
              >
                P{row.position} · {row.team.name} · {row.points ?? 0} pts
              </li>
            ))}
          </ul>
        </DataSection>
      </section>
    </Formula1DetailLayout>
  );
}
