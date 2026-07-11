'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { americanFootballLeagueBrowsePath } from '@/lib/american-football-paths';
import { useAmericanFootballLeaguesQuery } from '@/lib/query/american-football/hooks';
import { Card, SectionTitle } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';
import { AmericanFootballLoaderLink } from './AmericanFootballLoaderLink';

export function AmericanFootballLeaguesBrowse() {
  const leaguesRes = useAmericanFootballLeaguesQuery();
  const [query, setQuery] = useState('');

  const leagues = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return leaguesRes.data;
    return leaguesRes.data.filter((item) => {
      const parts = [item.league.name, item.country.name, item.league.type].filter(Boolean);
      return parts.some((part) => String(part).toLowerCase().includes(needle));
    });
  }, [leaguesRes.data, query]);

  return (
    <section className="space-y-4">
      <div>
        <SectionTitle>Ligas</SectionTitle>
        <p className="text-sm text-slate-400">
          Selecciona una liga para ver temporadas y partidos cargados en el portal.
        </p>
      </div>

      <label className="block max-w-md">
        <span className="sr-only">Buscar liga</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o país…"
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        />
      </label>

      <DataSection
        loading={leaguesRes.loading}
        error={leaguesRes.error}
        isEmpty={leagues.length === 0}
        onRetry={leaguesRes.reload}
        emptyTitle={
          query.trim()
            ? 'Ninguna liga coincide con la búsqueda'
            : 'Aún no hay ligas cargadas'
        }
        emptyHint={
          query.trim()
            ? 'Prueba otro término o limpia el filtro.'
            : 'Registra ligas y temporadas en la pestaña Carga de datos para poder explorar partidos.'
        }
        emptyAction={!query.trim() ? <AmericanFootballLoaderLink /> : undefined}
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {leagues.map((item) => (
            <li key={item.league.id}>
              <Link
                href={americanFootballLeagueBrowsePath(item.league.id)}
                className="block"
              >
                <Card className="transition hover:border-blue-500/40">
                  <div className="flex items-center gap-3">
                    {(item.league.altLogo ?? item.league.logo) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.league.altLogo ?? item.league.logo ?? ''}
                        alt=""
                        className="h-10 w-10 rounded bg-white/5 object-contain p-1"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-100">
                        {item.league.name ?? item.league.id}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {[item.country.name, item.league.type].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </DataSection>
    </section>
  );
}
