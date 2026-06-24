import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('LeagueDetail — partial coverage (Liga MX)', () => {
  it('renders seasons but shows empty states for missing standings/matches/teams', async () => {
    installFetch([
      { match: '/v1/leagues/262/seasons', body: collection([{ id: 'se', leagueId: 'lg_mx', year: 2025, current: true, startDate: null, endDate: null, externalId: null }]) },
      { match: '/v1/leagues/262/teams', body: collection([]) },
      { match: '/v1/leagues/262/standings', body: collection([]) },
      { match: '/v1/leagues/262/matches', body: collection([]) },
      { match: '/v1/leagues/262', body: league },
    ]);

    render(<LeagueDetail league="262" title="Liga MX" />);

    expect(await screen.findByRole('heading', { name: 'Liga MX' })).toBeInTheDocument();
    // Season chip from the API (data-driven, not hardcoded).
    expect(await screen.findByText(/2025/)).toBeInTheDocument();
    // Partial coverage: these resources are empty but render valid empty states.
    expect(await screen.findByText('No standings available')).toBeInTheDocument();
    expect(await screen.findByText('No matches available')).toBeInTheDocument();
    expect(await screen.findByText('No teams available')).toBeInTheDocument();
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
