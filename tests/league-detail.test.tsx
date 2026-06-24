import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LeagueDetail } from '@/components/views/LeagueDetail';
import { collection, installFetch, resource } from './helpers/mock-fetch';

afterEach(() => vi.unstubAllGlobals());

const league = resource({
  id: 'lg_mx',
  externalId: '262',
  name: 'Liga MX',
  type: 'League',
  sport: 'soccer',
  country: 'Mexico',
  logo: null,
  updatedAt: '2026-06-01T00:00:00Z',
});

const seasons = [
  { id: 'se25', leagueId: 'lg_mx', year: 2025, current: true, startDate: null, endDate: null, externalId: null },
  { id: 'se24', leagueId: 'lg_mx', year: 2024, current: false, startDate: null, endDate: null, externalId: null },
];

describe('LeagueDetail — partial coverage (Liga MX)', () => {
  it('renders a season sidebar with the current season selected by default', async () => {
    installFetch([
      { match: '/v1/leagues/262/seasons', body: collection(seasons) },
      { match: '/v1/leagues/262/matches', body: collection([]) },
      { match: '/v1/leagues/262/teams', body: collection([]) },
      { match: '/v1/leagues/262/standings', body: collection([]) },
      { match: '/v1/leagues/262', body: league },
    ]);

    render(<LeagueDetail league="262" title="Liga MX" />);

    expect(await screen.findByRole('heading', { name: 'Liga MX' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Temporadas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2025/i })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('heading', { name: 'Temporada 2025' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Apertura' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Clausura' })).toBeInTheDocument();
    expect(await screen.findByText('No hay clasificación disponible')).toBeInTheDocument();
    expect(await screen.findByText('No hay partidos disponibles')).toBeInTheDocument();
    expect(await screen.findByText('No hay equipos disponibles')).toBeInTheDocument();
  });

  it('updates the main content when another season is selected', async () => {
    installFetch([
      { match: '/v1/leagues/262/seasons', body: collection(seasons) },
      { match: '/v1/leagues/262/matches', body: collection([]) },
      { match: '/v1/leagues/262/teams', body: collection([]) },
      { match: '/v1/leagues/262/standings', body: collection([]) },
      { match: '/v1/leagues/262', body: league },
    ]);

    render(<LeagueDetail league="262" title="Liga MX" />);
    await screen.findByRole('button', { name: /2025/i });

    fireEvent.click(screen.getByRole('button', { name: /^2024$/i }));

    expect(screen.getByRole('button', { name: /^2024$/i })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('heading', { name: 'Temporada 2024' })).toBeInTheDocument();
  });

  it('shows a top-level error when the league is not found', async () => {
    installFetch([
      { match: '/v1/leagues/zzz/seasons', body: collection([]) },
      { match: '/v1/leagues/zzz/teams', body: collection([]) },
      { match: '/v1/leagues/zzz/standings', body: collection([]) },
      { match: '/v1/leagues/zzz/matches', body: collection([]) },
      { match: '/v1/leagues/zzz', ok: false, status: 404, body: { error: { code: 'RESOURCE_NOT_FOUND', message: 'League not found.', requestId: 'r' } } },
    ]);

    render(<LeagueDetail league="zzz" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('League not found.');
  });
});
