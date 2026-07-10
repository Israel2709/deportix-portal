'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Card } from '@/components/ui/Ui';
import { formatDateTimeShort } from '@/lib/format';
import { tournamentFromRound } from '@/lib/liga-mx';
import { ligaMxMatchDetailPath } from '@/lib/liga-mx-paths';
import { useLigaMxContenido } from '@/lib/use-liga-mx-contenido';
import { DataSection } from '@/components/states/States';
import { DetailField, LigaMxDetailLayout } from './LigaMxDetailLayout';

export function LigaMxTournamentDetail({
  year,
  name,
}: {
  year: string;
  name: string;
}) {
  const data = useLigaMxContenido();
  const decodedName = decodeURIComponent(name);
  const numericYear = Number(year);

  const tournamentMatches = useMemo(
    () =>
      data.matches.filter(
        (item) => item.year === numericYear && tournamentFromRound(item.match.round) === decodedName,
      ),
    [data.matches, decodedName, numericYear],
  );

  return (
    <LigaMxDetailLayout title={decodedName} subtitle={`Temporada ${year}`}>
      <DataSection
        loading={data.loading}
        error={data.error}
        isEmpty={!data.loading && !data.error && tournamentMatches.length === 0}
        emptyTitle="Sin partidos en este torneo"
        emptyHint="No hay partidos registrados para este torneo y temporada."
        onRetry={data.reload}
      >
        <dl className="mb-6 grid gap-4 sm:grid-cols-2">
          <DetailField label="Torneo" value={decodedName} />
          <DetailField label="Temporada" value={year} />
          <DetailField label="Partidos" value={tournamentMatches.length} />
        </dl>

        <div className="grid gap-3 sm:grid-cols-2">
          {tournamentMatches.map((item) => (
            <Link
              key={item.match.id}
              href={ligaMxMatchDetailPath(item.match.id, {
                seasonId: item.seasonId,
                year: item.year,
              })}
            >
              <Card className="transition hover:border-blue-500/40">
                <p className="font-medium text-slate-100">
                  {item.match.home.name ?? '—'} vs {item.match.away.name ?? '—'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {[item.match.round, formatDateTimeShort(item.match.date)].filter(Boolean).join(' · ')}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </DataSection>
    </LigaMxDetailLayout>
  );
}
