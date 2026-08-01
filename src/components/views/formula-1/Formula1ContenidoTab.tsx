'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';
import { AmericanFootballAccordion } from '@/components/views/american-football/AmericanFootballAccordion';
import { truncateCanonicalId } from '@/lib/formula-1-forms/shared';
import {
  formula1CircuitDetailPath,
  formula1CompetitionDetailPath,
  formula1DriverDetailPath,
  formula1RaceDetailPath,
  formula1SeasonBrowsePath,
  formula1TeamDetailPath,
} from '@/lib/formula-1-paths';
import { useFormula1Contenido } from '@/lib/use-formula-1-contenido';
import { Formula1LoaderLink } from './Formula1LoaderLink';

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

export function Formula1ContenidoTab() {
  const data = useFormula1Contenido();
  const latestSeason = data.seasons[0];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Contenido cargado vía BFF <code className="text-xs text-slate-500">/formula-1/*</code>.
        {latestSeason != null && (
          <> Carreras y rankings muestran la temporada más reciente ({latestSeason}).</>
        )}
      </p>

      <DataSection
        loading={data.loading}
        error={data.error}
        isEmpty={
          !data.loading &&
          !data.error &&
          data.competitions.length === 0 &&
          data.circuits.length === 0 &&
          data.teams.length === 0 &&
          data.drivers.length === 0 &&
          data.races.length === 0 &&
          data.seasons.length === 0
        }
        onRetry={data.reload}
        emptyTitle="Aún no hay contenido cargado"
        emptyHint="Usa la pestaña Carga de datos para registrar competiciones, circuitos, equipos y más."
        emptyAction={<Formula1LoaderLink />}
      >
        <div className="space-y-3">
          <AmericanFootballAccordion title="Temporadas" count={data.seasons.length} defaultOpen>
            {data.seasons.length === 0 ? (
              <p className="text-sm text-slate-500">Sin temporadas (derivadas de carreras).</p>
            ) : (
              <CardGrid>
                {data.seasons.map((year) => (
                  <RecordCard
                    key={year}
                    href={formula1SeasonBrowsePath(year)}
                    title={`Temporada ${year}`}
                    subtitle="Calendario y clasificación"
                  />
                ))}
              </CardGrid>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion title="Competiciones" count={data.competitions.length}>
            {data.competitions.length === 0 ? (
              <p className="text-sm text-slate-500">Sin competiciones.</p>
            ) : (
              <CardGrid>
                {data.competitions.map((item) => (
                  <RecordCard
                    key={item.id}
                    href={formula1CompetitionDetailPath(item.id)}
                    title={item.name}
                    meta={truncateCanonicalId(item.id)}
                  />
                ))}
              </CardGrid>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion title="Circuitos" count={data.circuits.length}>
            {data.circuits.length === 0 ? (
              <p className="text-sm text-slate-500">Sin circuitos.</p>
            ) : (
              <CardGrid>
                {data.circuits.map((item) => (
                  <RecordCard
                    key={item.id}
                    href={formula1CircuitDetailPath(item.id)}
                    title={item.name}
                    subtitle={item.country ?? undefined}
                    meta={truncateCanonicalId(item.id)}
                    logo={item.image}
                  />
                ))}
              </CardGrid>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion title="Equipos" count={data.teams.length}>
            {data.teams.length === 0 ? (
              <p className="text-sm text-slate-500">Sin equipos.</p>
            ) : (
              <CardGrid>
                {data.teams.map((item) => (
                  <RecordCard
                    key={item.id}
                    href={formula1TeamDetailPath(item.id)}
                    title={item.name}
                    meta={truncateCanonicalId(item.id)}
                    logo={item.logo}
                  />
                ))}
              </CardGrid>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion title="Pilotos" count={data.drivers.length}>
            {data.drivers.length === 0 ? (
              <p className="text-sm text-slate-500">Sin pilotos.</p>
            ) : (
              <CardGrid>
                {data.drivers.map((item) => (
                  <RecordCard
                    key={item.id}
                    href={formula1DriverDetailPath(item.id)}
                    title={item.name}
                    subtitle={
                      [item.number != null ? `#${item.number}` : null, item.team?.name]
                        .filter(Boolean)
                        .join(' · ') || undefined
                    }
                    meta={truncateCanonicalId(item.id)}
                    logo={item.team?.logo}
                  />
                ))}
              </CardGrid>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion
            title={latestSeason != null ? `Carreras ${latestSeason}` : 'Carreras'}
            count={data.races.length}
          >
            {data.races.length === 0 ? (
              <p className="text-sm text-slate-500">Sin sesiones en la temporada reciente.</p>
            ) : (
              <CardGrid>
                {data.races.map((item) => (
                  <RecordCard
                    key={item.id}
                    href={formula1RaceDetailPath(item.id)}
                    title={item.competition.name}
                    subtitle={`${item.type} · ${item.status}`}
                    meta={truncateCanonicalId(item.id)}
                    logo={item.circuit.image}
                  />
                ))}
              </CardGrid>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion
            title={
              latestSeason != null ? `Clasificación pilotos ${latestSeason}` : 'Clasificación pilotos'
            }
            count={data.driverRankings.length}
          >
            {data.driverRankings.length === 0 ? (
              <p className="text-sm text-slate-500">Sin clasificación de pilotos.</p>
            ) : (
              <ul className="space-y-2">
                {data.driverRankings.map((row) => (
                  <li
                    key={`${row.position}-${row.driver.id}`}
                    className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200"
                  >
                    P{row.position} · {row.driver.name}
                    {row.team?.name ? ` · ${row.team.name}` : ''} · {row.points ?? 0} pts
                  </li>
                ))}
              </ul>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion
            title={
              latestSeason != null
                ? `Clasificación constructores ${latestSeason}`
                : 'Clasificación constructores'
            }
            count={data.teamRankings.length}
          >
            {data.teamRankings.length === 0 ? (
              <p className="text-sm text-slate-500">Sin clasificación de equipos.</p>
            ) : (
              <ul className="space-y-2">
                {data.teamRankings.map((row) => (
                  <li
                    key={`${row.position}-${row.team.id}`}
                    className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200"
                  >
                    P{row.position} · {row.team.name} · {row.points ?? 0} pts
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
