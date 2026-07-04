import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToastProvider } from '@/components/notifications/ToastProvider';
import { NflView } from '@/components/views/NflView';
import { collection, installFetch, resource } from './helpers/mock-fetch';

afterEach(() => vi.unstubAllGlobals());

describe('NflView — progressive coverage with no data', () => {
  it('shows "no data loaded yet" when NFL has no leagues', async () => {
    installFetch([
      {
        match: '/v1/data-status',
        body: resource({
          sports: [
            {
              id: 'sp_nfl',
              slug: 'nfl',
              name: 'NFL',
              leagueCount: 0,
              coverage: { teams: false, matches: false, standings: false, statistics: false },
            },
          ],
          leagues: [],
        }),
      },
      { match: '/v1/leagues', body: collection([]) },
    ]);

    render(
      <ToastProvider>
        <NflView />
      </ToastProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'NFL' })).toBeInTheDocument();
    expect(await screen.findByText('Sin datos cargados aún')).toBeInTheDocument();
    expect(await screen.findByText(/Aún no hay datos de la NFL cargados/i)).toBeInTheDocument();
  });
});
