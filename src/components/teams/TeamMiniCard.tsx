'use client';

import Link from 'next/link';
import type { Team } from '@/lib/types';
import { editTeamFormPath } from '@/lib/team-form';
import { Card } from '@/components/ui/Ui';

export function TeamMiniCard({
  team,
  leagueId,
  hasOverride = false,
}: {
  team: Team;
  leagueId: string;
  hasOverride?: boolean;
}) {
  const displayLogo = team.altLogo ?? team.logo;
  const displayName = team.altName ?? team.name ?? team.id;

  return (
    <Card className="flex items-center gap-3 p-3">
      {displayLogo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={displayLogo} alt="" className="h-8 w-8 shrink-0 object-contain" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-100">{displayName}</p>
        {team.altName && team.name && team.altName !== team.name && (
          <p className="truncate text-xs text-slate-500">{team.name}</p>
        )}
        {team.venue?.name && (
          <p className="truncate text-xs text-slate-400">{team.venue.name}</p>
        )}
        {hasOverride && (
          <p className="mt-0.5 text-xs text-amber-400">Editado localmente</p>
        )}
      </div>
      <Link
        href={editTeamFormPath(leagueId, team.id)}
        className="shrink-0 rounded-md border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
        aria-label={`Editar ${displayName}`}
      >
        Editar
      </Link>
    </Card>
  );
}
