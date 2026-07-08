import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider } from '@/components/notifications/ToastProvider';
import { AmericanFootballView } from '@/components/views/AmericanFootballView';
import { collection, installFetch, resource } from './helpers/mock-fetch';

function renderAmericanFootball() {
  return render(
    <ToastProvider>
      <AmericanFootballView />
    </ToastProvider>,
  );
}

const statusRoute = {
  match: '/v1/data-status',
  body: resource({
    sports: [
      {
        id: 'sp_nfl',
        slug: 'american-football',
        name: 'American Football',
        leagueCount: 0,
        coverage: { teams: false, matches: false, standings: false, statistics: false },
      },
    ],
    leagues: [],
  }),
};

afterEach(() => vi.unstubAllGlobals());

describe('AmericanFootballView tabs and loader', () => {
  it('switches to carga de datos tab', async () => {
    installFetch([
      statusRoute,
      { match: '/v1/leagues', body: collection([]) },
      { match: '/american-football/leagues', body: { get: 'leagues', parameters: [], errors: [], results: 0, response: [] } },
      { match: '/v1/league-types', body: collection([{ code: 'league', label: 'Liga' }, { code: 'cup', label: 'Copa' }]) },
    ]);

    renderAmericanFootball();
    expect(await screen.findByRole('heading', { name: 'Football americano' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Carga de datos' }));
    expect(await screen.findByText(/Orden recomendado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1\. Ligas/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Países/i })).not.toBeInTheDocument();
  });

  it('shows Cargar datos CTA in empty leagues section', async () => {
    installFetch([statusRoute, { match: '/v1/leagues', body: collection([]) }]);

    renderAmericanFootball();
    expect(await screen.findByText(/Aún no hay datos de Football americano cargados/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a carga de datos' })).toBeInTheDocument();
  });
});
