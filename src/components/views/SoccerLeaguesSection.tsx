'use client';

import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';
import { filterLeaguesByQuery, leaguePath } from '@/lib/leagues';
import { useAllLeagues } from '@/lib/use-all-leagues';
import { useRecentSearches } from '@/lib/use-recent-searches';
import { Card, SectionTitle } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';

export function SoccerLeaguesSection() {
  const { recent, recordSearch } = useRecentSearches('soccer');
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const leagues = useAllLeagues('soccer', submittedQuery !== null);

  const filteredLeagues = useMemo(
    () => filterLeaguesByQuery(leagues.data, submittedQuery ?? ''),
    [leagues.data, submittedQuery],
  );

  function runSearch(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setSubmittedQuery(trimmed);
    recordSearch(trimmed);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch(query);
  }

  function applyRecentSearch(value: string) {
    runSearch(value);
  }

  return (
    <section className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm font-medium text-slate-200" htmlFor="league-search">
          Buscar liga
        </label>
        <input
          id="league-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filtrar por nombre o país…"
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        />
      </form>

      {recent.length > 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-sm font-medium text-slate-200">Búsquedas recientes</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {recent.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => applyRecentSearch(item)}
                  className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-200 hover:border-blue-500/40 hover:text-blue-200"
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {submittedQuery && (
        <>
          <SectionTitle>Resultados para “{submittedQuery}”</SectionTitle>
          <DataSection
            loading={leagues.loading}
            error={leagues.error}
            isEmpty={filteredLeagues.length === 0}
            onRetry={leagues.reload}
            loadingLabel="Cargando ligas…"
            emptyTitle="No hay ligas que coincidan con tu búsqueda"
            emptyHint="Prueba con otro nombre o país."
          >
            <ul className="grid gap-3 sm:grid-cols-2">
              {filteredLeagues.map((league) => (
                <li key={league.id}>
                  <Link href={leaguePath(league)} className="block">
                    <Card className="transition hover:border-blue-500/40">
                      <div className="flex items-center gap-3">
                        {(league.altLogo ?? league.logo) && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={league.altLogo ?? league.logo ?? ''}
                            alt=""
                            className="h-10 w-10 rounded bg-white/5 object-contain p-1"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-100">
                            {league.name ?? league.id}
                          </p>
                          {league.country && (
                            <p className="truncate text-xs text-slate-400">{league.country}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </DataSection>
        </>
      )}
    </section>
  );
}
