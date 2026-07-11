import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AmericanFootballLeagueBrowse } from '@/components/views/american-football/AmericanFootballLeagueBrowse';
import { AmericanFootballLeaguesBrowse } from '@/components/views/american-football/AmericanFootballLeaguesBrowse';
import { renderWithQueryClient } from './helpers/query-client';

afterEach(() => vi.unstubAllGlobals());

const bffEnvelope = (response: unknown[]) => ({
  get: 'resource',
  parameters: [],
  errors: [],
  results: response.length,
  response,
});

function installBffFetch(routes: { match: string; response: unknown[] }[]) {
  return vi.fn(async (input: unknown) => {
    const url = String(input);
    const route = routes.find((entry) => url.includes(entry.match));
    if (!route) throw new Error(`No mock route for ${url}`);
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify(bffEnvelope(route.response)),
      headers: { get: () => null },
    };
  });
}

describe('AmericanFootballLeaguesBrowse', () => {
  it('links leagues to the NFL browse route', async () => {
    vi.stubGlobal(
      'fetch',
      installBffFetch([
        {
          match: '/american-football/leagues',
          response: [
            {
              league: {
                id: '1',
                name: 'NFL',
                type: 'league',
                logo: 'https://example.com/americanFootball.png',
                altLogo: null,
              },
              country: { name: 'USA', code: 'US', flag: null },
              seasons: [{ year: 2022, current: true }],
            },
          ],
        },
      ]),
    );

    renderWithQueryClient(<AmericanFootballLeaguesBrowse />);

    const link = await screen.findByRole('link', { name: /NFL/i });
    expect(link).toHaveAttribute('href', '/american-football/leagues/1');
  });

  it('shows empty state with loader link when there are no leagues', async () => {
    vi.stubGlobal('fetch', installBffFetch([{ match: '/american-football/leagues', response: [] }]));

    renderWithQueryClient(<AmericanFootballLeaguesBrowse />);

    expect(await screen.findByText('Aún no hay ligas cargadas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a carga de datos' })).toHaveAttribute(
      'href',
      '/american-football?tab=loader',
    );
  });
});

describe('AmericanFootballLeagueBrowse', () => {
  it('shows season sidebar and empty matches with loader link', async () => {
    vi.stubGlobal(
      'fetch',
      installBffFetch([
        {
          match: '/american-football/leagues?id=1',
          response: [
            {
              league: {
                id: '1',
                name: 'NFL',
                type: 'league',
                logo: 'https://example.com/americanFootball.png',
                altLogo: null,
              },
              country: { name: 'USA', code: 'US', flag: null },
              seasons: [{ year: 2022, current: true }],
            },
          ],
        },
        { match: '/american-football/leagues', response: [] },
        { match: '/american-football/seasons?league=1', response: [2022] },
        { match: '/american-football/teams?league=1&season=2022', response: [] },
        { match: '/american-football/games?league=1&season=2022', response: [] },
      ]),
    );

    renderWithQueryClient(<AmericanFootballLeagueBrowse leagueId="1" />);

    expect(await screen.findByRole('heading', { name: 'NFL' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Temporadas' })).toBeInTheDocument();
    expect(await screen.findByText('Aún no hay partidos cargados')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Cargar información' })[0]).toHaveAttribute(
      'href',
      '/american-football?tab=loader',
    );
  });

  it('shows seasons empty state with loader link', async () => {
    vi.stubGlobal(
      'fetch',
      installBffFetch([
        {
          match: '/american-football/leagues?id=1',
          response: [
            {
              league: { id: '1', name: 'NFL', type: 'league', logo: null, altLogo: null },
              country: { name: 'USA', code: 'US', flag: null },
              seasons: [],
            },
          ],
        },
        { match: '/american-football/leagues', response: [] },
        { match: '/american-football/seasons?league=1', response: [] },
      ]),
    );

    renderWithQueryClient(<AmericanFootballLeagueBrowse leagueId="1" />);

    expect(await screen.findByText('Sin temporadas cargadas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cargar información' })).toHaveAttribute(
      'href',
      '/american-football?tab=loader',
    );
  });

  it('updates matches when another season is selected', async () => {
    vi.stubGlobal(
      'fetch',
      installBffFetch([
        {
          match: '/american-football/leagues?id=1',
          response: [
            {
              league: { id: '1', name: 'NFL', type: 'league', logo: null, altLogo: null },
              country: { name: 'USA', code: 'US', flag: null },
              seasons: [
                { year: 2022, current: true },
                { year: 2021, current: false },
              ],
            },
          ],
        },
        { match: '/american-football/leagues', response: [] },
        { match: '/american-football/seasons?league=1', response: [2022, 2021] },
        { match: '/american-football/teams?league=1&season=2022', response: [] },
        { match: '/american-football/teams?league=1&season=2021', response: [] },
        { match: '/american-football/games?league=1&season=2022', response: [] },
        { match: '/american-football/games?league=1&season=2021', response: [] },
      ]),
    );

    renderWithQueryClient(<AmericanFootballLeagueBrowse leagueId="1" />);
    await screen.findByRole('button', { name: /2022/i });

    fireEvent.click(screen.getByRole('button', { name: /^2021$/i }));

    expect(screen.getByRole('heading', { name: 'Partidos · 2021' })).toBeInTheDocument();
  });
});
