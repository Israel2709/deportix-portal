'use client';

import { useMemo } from 'react';
import type { Match } from '@/lib/types';
import { LIGA_MX_DEFAULT_SEASON_YEAR, resolveLigaMxTournaments } from '@/lib/liga-mx';
import { Card, SectionTitle } from '@/components/ui/Ui';

export function LigaMxSeasonSection({
  year = LIGA_MX_DEFAULT_SEASON_YEAR,
  matches,
}: {
  year?: number;
  matches: Match[];
}) {
  const tournaments = useMemo(() => resolveLigaMxTournaments(matches), [matches]);

  return (
    <section>
      <SectionTitle>Temporada {year}</SectionTitle>
      <div className="flex flex-col gap-3">
        {tournaments.map((tournament) => (
          <Card key={tournament}>
            <h3 className="text-lg font-semibold text-slate-100">{tournament}</h3>
            <p className="mt-1 text-sm text-slate-400">Torneo · Temporada {year}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
