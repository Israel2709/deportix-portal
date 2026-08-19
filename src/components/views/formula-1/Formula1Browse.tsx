'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Card, SectionTitle } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';
import { formatDateTime } from '@/lib/format';
import {
  competitionsForCountry,
  findCompetitionInCountry,
  racesForBrowseSelection,
  seasonsForCompetitionInCountry,
} from '@/lib/formula-1-browse';
import { formula1BrowsePath, formula1RaceDetailPath, parseFormula1BrowseParams } from '@/lib/formula-1-paths';
import { useFormula1BrowseIndex } from '@/lib/use-formula-1-browse-index';
import { Formula1LoaderLink } from './Formula1LoaderLink';

function BrowseBreadcrumb({
  country,
  competitionId,
  competitionName,
  season,
}: {
  country?: string;
  competitionId?: string;
  competitionName?: string;
  season?: string;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
      <Link href={formula1BrowsePath()} className="text-blue-400 hover:text-blue-300">
        Países
      </Link>
      {country && (
        <>
          <span aria-hidden>/</span>
          {competitionId || season ? (
            <Link
              href={formula1BrowsePath({ country })}
              className="text-blue-400 hover:text-blue-300"
            >
              {country}
            </Link>
          ) : (
            <span className="text-slate-200">{country}</span>
          )}
        </>
      )}
      {(competitionName || competitionId) && (
        <>
          <span aria-hidden>/</span>
          {season ? (
            <Link
              href={formula1BrowsePath({ country, competition: competitionId })}
              className="text-blue-400 hover:text-blue-300"
            >
              {competitionName ?? competitionId}
            </Link>
          ) : (
            <span className="text-slate-200">{competitionName ?? competitionId}</span>
          )}
        </>
      )}
      {season && (
        <>
          <span aria-hidden>/</span>
          <span className="text-slate-200">Temporada {season}</span>
        </>
      )}
    </nav>
  );
}

export function Formula1Browse() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const browse = parseFormula1BrowseParams({
    country: searchParams.get('country'),
    competition: searchParams.get('competition'),
    season: searchParams.get('season'),
  });
  const index = useFormula1BrowseIndex();

  const country = browse.country;
  const competitionId = browse.competition;
  const seasonParam = browse.season;
  const seasonYear = seasonParam ? Number(seasonParam) : null;

  const competitions = useMemo(
    () => (country ? competitionsForCountry(index.races, country) : []),
    [country, index.races],
  );

  const competition = useMemo(
    () =>
      country && competitionId
        ? findCompetitionInCountry(index.races, country, competitionId)
        : null,
    [country, competitionId, index.races],
  );

  const seasons = useMemo(
    () =>
      country && competitionId
        ? seasonsForCompetitionInCountry(index.races, country, competitionId)
        : [],
    [country, competitionId, index.races],
  );

  const races = useMemo(() => {
    if (!country || !competitionId || seasonYear == null || Number.isNaN(seasonYear)) return [];
    return racesForBrowseSelection(index.races, country, competitionId, seasonYear);
  }, [country, competitionId, index.races, seasonYear]);

  const step = useMemo(() => {
    if (!country) return 'countries';
    if (!competitionId) return 'competitions';
    if (!seasonParam) return 'seasons';
    return 'races';
  }, [country, competitionId, seasonParam]);

  function goTo(path: ReturnType<typeof formula1BrowsePath>) {
    router.push(path);
  }

  return (
    <section className="space-y-4">
      <div>
        <SectionTitle>Explorar calendario</SectionTitle>
        <p className="mt-1 text-sm text-slate-400">
          País (sede del circuito) → competición (Gran Premio) → temporada → sesiones de carrera.
          En F1 el país no está en la competición; se infiere del circuito donde se corrió.
        </p>
      </div>

      {step !== 'countries' && (
        <BrowseBreadcrumb
          country={country}
          competitionId={competitionId}
          competitionName={competition?.name}
          season={seasonParam}
        />
      )}

      <DataSection
        loading={index.loading}
        error={index.error}
        isEmpty={step === 'countries' && index.countries.length === 0}
        onRetry={index.reload}
        emptyTitle="Sin países disponibles"
        emptyHint="Registra circuitos y carreras con país en la carga de datos."
        emptyAction={<Formula1LoaderLink />}
      >
        {step === 'countries' && (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {index.countries.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => goTo(formula1BrowsePath({ country: item }))}
                  className="block w-full text-left"
                >
                  <Card className="transition hover:border-blue-500/40">
                    <p className="font-medium text-slate-100">{item}</p>
                    <p className="text-xs text-slate-400">Ver competiciones en este país</p>
                  </Card>
                </button>
              </li>
            ))}
          </ul>
        )}

        {step === 'competitions' && country && (
          <>
            {competitions.length === 0 ? (
              <p className="text-sm text-slate-500">
                No hay carreras cargadas en {country}. Registra sesiones con un circuito de este país.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {competitions.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() =>
                        goTo(formula1BrowsePath({ country, competition: item.id }))
                      }
                      className="block w-full text-left"
                    >
                      <Card className="transition hover:border-blue-500/40">
                        <p className="font-medium text-slate-100">{item.name}</p>
                        <p className="text-xs text-slate-400">Elegir temporada</p>
                      </Card>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {step === 'seasons' && country && competitionId && (
          <>
            {!competition && (
              <p className="text-sm text-amber-400">
                La competición seleccionada no tiene carreras en {country}.
              </p>
            )}
            {seasons.length === 0 ? (
              <p className="text-sm text-slate-500">
                Sin temporadas para esta competición en {country}.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {seasons.map((year) => (
                  <li key={year}>
                    <button
                      type="button"
                      onClick={() =>
                        goTo(
                          formula1BrowsePath({
                            country,
                            competition: competitionId,
                            season: year,
                          }),
                        )
                      }
                      className="block w-full text-left"
                    >
                      <Card className="transition hover:border-blue-500/40">
                        <p className="font-medium text-slate-100">{year}</p>
                        <p className="text-xs text-slate-400">Ver sesiones</p>
                      </Card>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {step === 'races' && country && competitionId && seasonParam && (
          <>
            {races.length === 0 ? (
              <p className="text-sm text-slate-500">
                No hay sesiones para {competition?.name ?? 'esta competición'} · {country} ·{' '}
                {seasonParam}.
              </p>
            ) : (
              <ul className="space-y-2">
                {races.map((item) => (
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
            )}
          </>
        )}
      </DataSection>
    </section>
  );
}
