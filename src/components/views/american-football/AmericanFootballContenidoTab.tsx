'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Ui';
import { truncateCanonicalId } from '@/lib/american-football-forms/shared';
import {
  americanFootballGameDetailPath,
  americanFootballLeaguePath,
  americanFootballSeasonDetailPath,
  americanFootballStandingDetailPath,
  americanFootballTeamDetailPath,
  americanFootballTimezoneDetailPath,
} from '@/lib/american-football-paths';
import { useAmericanFootballContenido } from '@/lib/use-american-football-contenido';
import { DataSection } from '@/components/states/States';
import { AmericanFootballAccordion } from './AmericanFootballAccordion';
import { AmericanFootballLoaderLink } from './AmericanFootballLoaderLink';

function RecordCard({
  href,
  title,
  subtitle,
  meta,
  logo,
}: {
  href: string;
  title: string;
  subtitle?: string;
  meta?: string;
  logo?: string | null;
}) {
  return (
    <Link href={href} className="block h-full">
      <Card className="flex h-full gap-3 transition hover:border-blue-500/40">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="h-10 w-10 shrink-0 rounded object-contain" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-800 text-xs text-slate-500">
            —
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-100">{title}</p>
          {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
          {meta && <p className="mt-1 truncate font-mono text-[11px] text-slate-500">{meta}</p>}
        </div>
      </Card>
    </Link>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export function AmericanFootballContenidoTab({ refreshKey = 0 }: { refreshKey?: number }) {
  const data = useAmericanFootballContenido(refreshKey);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Todo el contenido cargado vía BFF, agrupado por tipo. Haz clic en un registro para ver su detalle.
      </p>

      <DataSection
        loading={data.loading}
        error={data.error}
        isEmpty={
          !data.loading &&
          !data.error &&
          data.leagues.length === 0 &&
          data.seasons.length === 0 &&
          data.teams.length === 0 &&
          data.games.length === 0 &&
          data.standings.length === 0 &&
          data.timezones.length === 0
        }
        onRetry={data.reload}
        emptyTitle="Aún no hay contenido cargado"
        emptyHint="Usa la pestaña Carga de datos para registrar ligas, temporadas, equipos y más."
        emptyAction={<AmericanFootballLoaderLink />}
      >
        <div className="space-y-3">
          <AmericanFootballAccordion title="Ligas" count={data.leagues.length} defaultOpen>
            {data.leagues.length === 0 ? (
              <p className="text-sm text-slate-500">Sin ligas registradas.</p>
            ) : (
              <CardGrid>
                {data.leagues.map((item) => (
                  <RecordCard
                    key={item.league.id}
                    href={americanFootballLeaguePath({ id: item.league.id, externalId: null })}
                    title={item.league.name}
                    subtitle={item.country.name}
                    meta={truncateCanonicalId(item.league.id)}
                    logo={item.league.logo}
                  />
                ))}
              </CardGrid>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion title="Temporadas" count={data.seasons.length}>
            {data.seasons.length === 0 ? (
              <p className="text-sm text-slate-500">Sin temporadas registradas.</p>
            ) : (
              <CardGrid>
                {data.seasons.map((item) => (
                  <RecordCard
                    key={`${item.leagueId}-${item.year}`}
                    href={americanFootballSeasonDetailPath(item.leagueId, item.year)}
                    title={`Temporada ${item.year}`}
                    subtitle={item.leagueName}
                    meta={item.leagueId}
                  />
                ))}
              </CardGrid>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion title="Equipos" count={data.teams.length}>
            {data.teams.length === 0 ? (
              <p className="text-sm text-slate-500">Sin equipos registrados.</p>
            ) : (
              <CardGrid>
                {data.teams.map((item) => (
                  <RecordCard
                    key={`${item.leagueId}-${item.season}-${item.team.id}`}
                    href={americanFootballTeamDetailPath(item.team.id, {
                      league: item.leagueId,
                      season: item.season,
                    })}
                    title={item.team.name}
                    subtitle={`${item.leagueName} · ${item.season}`}
                    meta={truncateCanonicalId(item.team.id)}
                    logo={item.team.logo}
                  />
                ))}
              </CardGrid>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion title="Partidos" count={data.games.length}>
            {data.games.length === 0 ? (
              <p className="text-sm text-slate-500">Sin partidos registrados.</p>
            ) : (
              <CardGrid>
                {data.games.map((item) => (
                  <RecordCard
                    key={item.game.id}
                    href={americanFootballGameDetailPath(item.game.id)}
                    title={`${item.teams.home.name} vs ${item.teams.away.name}`}
                    subtitle={[item.game.week, item.game.date?.date, item.league.name].filter(Boolean).join(' · ')}
                    meta={truncateCanonicalId(item.game.id)}
                  />
                ))}
              </CardGrid>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion title="Clasificación" count={data.standings.length}>
            {data.standings.length === 0 ? (
              <p className="text-sm text-slate-500">Sin filas de clasificación registradas.</p>
            ) : (
              <CardGrid>
                {data.standings.map((item) => (
                  <RecordCard
                    key={`${item.leagueId}-${item.season}-${item.standing.id}`}
                    href={americanFootballStandingDetailPath(item.standing.id, {
                      league: item.leagueId,
                      season: item.season,
                    })}
                    title={`#${item.standing.position ?? '—'} ${item.standing.team.name}`}
                    subtitle={`${item.leagueName} · ${item.season}`}
                    meta={truncateCanonicalId(item.standing.id)}
                    logo={item.standing.team.logo}
                  />
                ))}
              </CardGrid>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion title="Timezones" count={data.timezones.length}>
            {data.timezones.length === 0 ? (
              <p className="text-sm text-slate-500">Sin timezones registrados.</p>
            ) : (
              <CardGrid>
                {data.timezones.map((timezone) => (
                  <RecordCard
                    key={timezone}
                    href={americanFootballTimezoneDetailPath(timezone)}
                    title={timezone}
                    subtitle="Zona horaria IANA"
                  />
                ))}
              </CardGrid>
            )}
          </AmericanFootballAccordion>
        </div>
      </DataSection>
    </div>
  );
}
