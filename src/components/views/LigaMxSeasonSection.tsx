'use client';

import { useMemo } from 'react';
import { useApi } from '@/lib/use-api';
import type { ApiCollection, Match } from '@/lib/types';
import { LIGA_MX_DEFAULT_SEASON_YEAR, resolveLigaMxTournaments } from '@/lib/liga-mx';
import { Card, SectionTitle } from '@/components/ui/Ui';

export function LigaMxSeasonSection({
  leagueId,
  year = LIGA_MX_DEFAULT_SEASON_YEAR,
}: {
  leagueId: string;
  year?: number;
}) {
  const id = encodeURIComponent(leagueId);
  const matchesRes = useApi<ApiCollection<Match>>(
    `/v1/leagues/${id}/matches?season=${year}&pageSize=100`,
  );

  const tournaments = useMemo(
    () => resolveLigaMxTournaments(matchesRes.data?.data ?? []),
    [matchesRes.data],
  );

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
