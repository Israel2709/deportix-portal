import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AmericanFootballLeagueBrowse } from '@/components/views/american-football/AmericanFootballLeagueBrowse';
import { AmericanFootballLeaguesBrowse } from '@/components/views/american-football/AmericanFootballLeaguesBrowse';
import { collection, installFetch, resource } from './helpers/mock-fetch';

afterEach(() => vi.unstubAllGlobals());

const americanFootballLeague = resource({
  id: 'lg_nfl',
  externalId: '1',
  name: 'NFL',
  type: 'league',
  sport: 'american-football',
  country: 'USA',
  logo: 'https://example.com/americanFootball.png',
  altLogo: null,
  updatedAt: '2026-06-01T00:00:00Z',
});

const seasons = [
  {
    id: 'se22',
    leagueId: 'lg_nfl',
    year: 2022,
    current: true,
    startDate: null,
    endDate: null,
    externalId: null,
  },
];

describe('AmericanFootballLeaguesBrowse', () => {
  it('links leagues to the NFL browse route', async () => {
    installFetch([{ match: '/v1/leagues?sport=american-football', body: collection([americanFootballLeague.data]) }]);

    render(<AmericanFootballLeaguesBrowse />);

    const link = await screen.findByRole('link', { name: /NFL/i });
    expect(link).toHaveAttribute('href', '/american-football/leagues/1');
  });

  it('shows empty state with loader link when there are no leagues', async () => {
    installFetch([{ match: '/v1/leagues?sport=american-football', body: collection([]) }]);

    render(<AmericanFootballLeaguesBrowse />);

    expect(await screen.findByText('Aún no hay ligas NFL cargadas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a carga de datos' })).toHaveAttribute(
      'href',
      '/american-football?tab=loader',
    );
  });
});

describe('AmericanFootballLeagueBrowse', () => {
  it('shows season sidebar and empty matches with loader link', async () => {
    installFetch([
      { match: '/v1/leagues/1/seasons', body: collection(seasons) },
      { match: '/v1/leagues/1/teams', body: collection([]) },
      { match: '/v1/leagues/1/matches', body: collection([]) },
      { match: '/v1/leagues/1', body: americanFootballLeague },
    ]);

    render(<AmericanFootballLeagueBrowse leagueId="1" />);

    expect(await screen.findByRole('heading', { name: 'NFL' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Temporadas' })).toBeInTheDocument();
    expect(await screen.findByText('Aún no hay partidos cargados')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Cargar información' })[0]).toHaveAttribute(
      'href',
      '/american-football?tab=loader',
    );
  });

  it('shows seasons empty state with loader link', async () => {
    installFetch([
      { match: '/v1/leagues/1/seasons', body: collection([]) },
      { match: '/v1/leagues/1/teams', body: collection([]) },
      { match: '/v1/leagues/1/matches', body: collection([]) },
      { match: '/v1/leagues/1', body: americanFootballLeague },
    ]);

    render(<AmericanFootballLeagueBrowse leagueId="1" />);

    expect(await screen.findByText('Sin temporadas cargadas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cargar información' })).toHaveAttribute(
      'href',
      '/american-football?tab=loader',
    );
  });

  it('updates matches when another season is selected', async () => {
    const seasonsWithTwo = [
      ...seasons,
      {
        id: 'se21',
        leagueId: 'lg_nfl',
        year: 2021,
        current: false,
        startDate: null,
        endDate: null,
        externalId: null,
      },
    ];

    installFetch([
      { match: '/v1/leagues/1/seasons', body: collection(seasonsWithTwo) },
      { match: '/v1/leagues/1/teams', body: collection([]) },
      { match: '/v1/leagues/1/matches', body: collection([]) },
      { match: '/v1/leagues/1', body: americanFootballLeague },
    ]);

    render(<AmericanFootballLeagueBrowse leagueId="1" />);
    await screen.findByRole('button', { name: /2022/i });

    fireEvent.click(screen.getByRole('button', { name: /^2021$/i }));

    expect(screen.getByRole('heading', { name: 'Partidos · 2021' })).toBeInTheDocument();
  });
});
