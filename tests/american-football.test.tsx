import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { AmericanFootballView } from '@/components/views/AmericanFootballView';
import { collection, installFetch, resource } from './helpers/mock-fetch';
import { renderWithAppProviders } from './helpers/render';

afterEach(() => vi.unstubAllGlobals());

const bffEnvelope = (response: unknown[]) => ({
  get: 'resource',
  parameters: [],
  errors: [],
  results: response.length,
  response,
});

describe('AmericanFootballView — progressive coverage with no data', () => {
  it('shows "no data loaded yet" when american football has no leagues', async () => {
    installFetch([
      {
        match: '/v1/data-status',
        body: resource({
          sports: [
            {
              id: 'sp_nfl',
              slug: 'american-football',
              name: 'NFL',
              leagueCount: 0,
              coverage: { teams: false, matches: false, standings: false, statistics: false },
            },
          ],
          leagues: [],
        }),
      },
      {
        match: '/american-football/leagues',
        body: bffEnvelope([]),
      },
    ]);

    renderWithAppProviders(<AmericanFootballView initialTab="coverage" />, { withToast: true });

    expect(await screen.findByRole('heading', { name: 'Football americano' })).toBeInTheDocument();
    expect(await screen.findByText('Sin datos cargados aún')).toBeInTheDocument();
    expect(await screen.findByText(/Aún no hay datos de Football americano cargados/i)).toBeInTheDocument();
  });
});
