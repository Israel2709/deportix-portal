'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';
import { AmericanFootballAccordion } from '@/components/views/american-football/AmericanFootballAccordion';
import { truncateCanonicalId } from '@/lib/tennis-forms/shared';
import { filterTennisTournaments, formatTennisTournamentLabel } from '@/lib/tennis-display';
import { tennisTournamentDetailPath } from '@/lib/tennis-paths';
import { useTennisContenidoQuery } from '@/lib/query/tennis/hooks';
import { TennisLoaderLink } from './TennisLoaderLink';

export function TennisContenidoTab() {
  const data = useTennisContenidoQuery();
  const [tournamentQuery, setTournamentQuery] = useState('');

  const tournaments = useMemo(
    () => filterTennisTournaments(data.tournaments, tournamentQuery),
    [data.tournaments, tournamentQuery],
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Contenido cargado vía BFF <code className="text-xs text-slate-500">/tennis/*</code> (incluye
        borradores con <code className="text-xs text-slate-500">published=all</code>).
      </p>

      <DataSection
        loading={data.loading}
        error={data.error}
        isEmpty={
          !data.loading &&
          !data.error &&
          data.tournaments.length === 0 &&
          data.players.length === 0
        }
        onRetry={data.reload}
        emptyTitle="Aún no hay contenido cargado"
        emptyHint="Usa la pestaña Carga de datos para registrar jugadores, torneos y el Main Draw."
        emptyAction={<TennisLoaderLink />}
      >
        <div className="space-y-3">
          <AmericanFootballAccordion title="Torneos" count={tournaments.length} defaultOpen>
            <label className="mb-3 block max-w-xl">
              <span className="sr-only">Buscar torneo</span>
              <input
                type="search"
                value={tournamentQuery}
                onChange={(e) => setTournamentQuery(e.target.value)}
                placeholder="Buscar por nombre, ciudad, fecha, país, ATP/WTA…"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </label>

            {data.tournaments.length === 0 ? (
              <p className="text-sm text-slate-500">Sin torneos.</p>
            ) : tournaments.length === 0 ? (
              <p className="text-sm text-slate-500">
                Ningún torneo coincide con «{tournamentQuery.trim()}».
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {tournaments.map((item) => (
                  <Link
                    key={item.id}
                    href={tennisTournamentDetailPath(item.id)}
                    className="block"
                  >
                    <Card className="space-y-1 transition hover:border-blue-500/40">
                      <div className="flex items-start gap-3">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded object-contain bg-slate-950"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-100">{item.name}</p>
                          <p className="text-xs text-slate-400">
                            {formatTennisTournamentLabel(item, { publishedStyle: 'none' })}
                          </p>
                          <p className="text-xs text-slate-500">
                            {[item.city, item.country.code].filter(Boolean).join(', ')}
                            {item.city || item.country.code ? ' · ' : ''}
                            {item.startDate} — {item.endDate}
                            {item.published ? ' · publicado' : ' · borrador'}
                          </p>
                          <p className="font-mono text-[11px] text-slate-600" title={item.id}>
                            {truncateCanonicalId(item.id)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion title="Jugadores" count={data.players.length}>
            {data.players.length === 0 ? (
              <p className="text-sm text-slate-500">Sin jugadores.</p>
            ) : (
              <ul className="space-y-2">
                {data.players.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200"
                  >
                    {item.displayName} ({item.fullName}) · {item.country.code}
                    {item.published ? '' : ' · borrador'}
                  </li>
                ))}
              </ul>
            )}
          </AmericanFootballAccordion>
        </div>
      </DataSection>
    </div>
  );
}
