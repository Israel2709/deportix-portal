import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
      {
        match: '/american-football/countries',
        body: { get: 'countries', parameters: [], errors: [], results: 0, response: [] },
      },
    ]);

    renderAmericanFootball();
    expect(await screen.findByRole('heading', { name: 'NFL' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Carga de datos' }));
    expect(await screen.findByText(/Orden recomendado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1\. Países/i })).toBeInTheDocument();
  });

  it('shows Cargar datos CTA in empty leagues section', async () => {
    installFetch([statusRoute, { match: '/v1/leagues', body: collection([]) }]);

    renderAmericanFootball();
    expect(await screen.findByText(/Aún no hay datos de la NFL cargados/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a carga de datos' })).toBeInTheDocument();
  });

  it('shows success toast after creating country', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? 'GET';
        let body: unknown = { get: 'countries', parameters: [], errors: [], results: 0, response: [] };
        if (url.includes('/v1/data-status')) body = statusRoute.body;
        if (url.includes('/v1/leagues')) body = collection([]);
        if (url.includes('/american-football/countries') && method === 'POST') {
          body = {
            get: 'countries',
            parameters: [],
            errors: [],
            results: 1,
            response: [{ name: 'USA', code: 'US', flag: null }],
          };
        }
        return {
          ok: true,
          status: method === 'POST' ? 200 : 200,
          text: async () => JSON.stringify(body),
          headers: { get: () => null },
        } as unknown as Response;
      }),
    );

    renderAmericanFootball();
    await screen.findByRole('heading', { name: 'NFL' });
    fireEvent.click(screen.getByRole('button', { name: 'Carga de datos' }));
    await screen.findByText(/Orden recomendado/i);

    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('País creado');
    });
  });
});
