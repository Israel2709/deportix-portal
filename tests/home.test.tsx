import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HomeView } from '@/components/views/HomeView';
import { collection, installFetch, installPendingFetch, resource } from './helpers/mock-fetch';

afterEach(() => vi.unstubAllGlobals());

const dataStatus = resource({
  sports: [
    {
      id: 'sp1',
      slug: 'soccer',
      name: 'Soccer',
      leagueCount: 1230,
      coverage: { teams: true, matches: true, standings: true, statistics: false },
    },
    {
      id: 'sp2',
      slug: 'american-football',
      name: 'NFL',
      leagueCount: 0,
      coverage: { teams: false, matches: false, standings: false, statistics: false },
    },
  ],
  leagues: [
    {
      id: 'lg_mx',
      externalId: '262',
      name: 'Liga MX',
      sport: 'soccer',
      availableSeasons: [2025],
      coverage: { teams: false, matches: false, standings: false, statistics: false },
      updatedAt: '2026-06-01T00:00:00Z',
    },
  ],
});

describe('HomeView', () => {
  it('shows the loading state while data-status is in flight', () => {
    installPendingFetch();
    render(<HomeView />);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('consumes data-status and renders sports', async () => {
    installFetch([
      { match: '/v1/data-status', body: dataStatus },
      { match: '/v1/health', body: resource({ status: 'ok', apiVersion: 'v1', dataSourceConfigured: true, timestamp: '2026-06-23T00:00:00Z' }) },
    ]);
    render(<HomeView />);
    expect(await screen.findByRole('heading', { name: 'Soccer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'NFL' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Soccer' }).closest('a')).toHaveAttribute(
      'href',
      '/deportes/soccer',
    );
    expect(screen.getByRole('heading', { name: 'NFL' }).closest('a')).toHaveAttribute(
      'href',
      '/american-football',
    );
    expect(screen.getAllByText('Disponible').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sin datos cargados aún').length).toBeGreaterThan(0);
  });

  it('shows an error state with retry when data-status fails', async () => {
    installFetch([
      { match: '/v1/data-status', ok: false, status: 503, body: { error: { code: 'X', message: 'down', requestId: 'r' } } },
      { match: '/v1/health', body: resource({ status: 'ok', apiVersion: 'v1', dataSourceConfigured: true, timestamp: 't' }) },
    ]);
    render(<HomeView />);
    expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
  });
});
