import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { AmericanFootballView } from '@/components/views/AmericanFootballView';
import { collection, installFetch, resource } from './helpers/mock-fetch';
import { renderWithAppProviders } from './helpers/render';

const bffEnvelope = (response: unknown[]) => ({
  get: 'resource',
  parameters: [],
  errors: [],
  results: response.length,
  response,
});

function renderAmericanFootball(initialTab?: 'contenido' | 'coverage' | 'browse' | 'loader') {
  return renderWithAppProviders(
    <AmericanFootballView initialTab={initialTab} />,
    { withToast: true },
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

const emptyLeaguesRoute = {
  match: '/american-football/leagues',
  body: bffEnvelope([]),
};

afterEach(() => vi.unstubAllGlobals());

describe('AmericanFootballView tabs and loader', () => {
  it('switches to carga de datos tab', async () => {
    installFetch([
      statusRoute,
      emptyLeaguesRoute,
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
    installFetch([statusRoute, emptyLeaguesRoute]);

    renderAmericanFootball('coverage');
    expect(await screen.findByText(/Aún no hay datos de Football americano cargados/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a carga de datos' })).toBeInTheDocument();
  });

  it('disables season league selector when no leagues exist', async () => {
    installFetch([
      statusRoute,
      emptyLeaguesRoute,
      { match: '/v1/league-types', body: collection([{ code: 'league', label: 'Liga' }]) },
    ]);

    renderAmericanFootball();
    fireEvent.click(await screen.findByRole('button', { name: 'Carga de datos' }));
    fireEvent.click(await screen.findByRole('button', { name: /2\. Temporadas/i }));

    expect(await screen.findByText('sin ligas cargadas, crea una liga para poder agregar temporadas')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('disables team season selector when league has no seasons', async () => {
    const leagueId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    installFetch([
      statusRoute,
      {
        match: '/american-football/leagues',
        body: bffEnvelope([
          {
            league: { id: leagueId, name: 'NFL', type: 'league', logo: null },
            country: { name: 'USA', code: 'US', flag: null },
            seasons: [],
          },
        ]),
      },
      {
        match: `/american-football/seasons?league=${leagueId}`,
        body: bffEnvelope([]),
      },
      { match: '/v1/league-types', body: collection([{ code: 'league', label: 'Liga' }]) },
    ]);

    renderAmericanFootball();
    fireEvent.click(await screen.findByRole('button', { name: 'Carga de datos' }));
    fireEvent.click(await screen.findByRole('button', { name: /3\. Equipos/i }));

    expect(await screen.findByText('sin temporadas cargadas, agrega una temporada en el paso Temporadas')).toBeInTheDocument();
    const selects = screen.getAllByRole('combobox');
    expect(selects[1]).toBeDisabled();
  });
});
