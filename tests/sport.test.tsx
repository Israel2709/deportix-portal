import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SportView } from '@/components/views/SportView';
import { filterLeaguesByQuery } from '@/lib/leagues';
import { readRecentSearches, recentSearchStorageKey } from '@/lib/recent-searches';
import { collection, installFetch } from './helpers/mock-fetch';

afterEach(() => vi.unstubAllGlobals());

const soccerLeagues = [
  {
    id: 'lg_mx',
    externalId: '262',
    name: 'Liga MX',
    type: 'League',
    sport: 'soccer',
    country: 'Mexico',
    logo: null,
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'lg_es',
    externalId: '140',
    name: 'La Liga',
    type: 'League',
    sport: 'soccer',
    country: 'Spain',
    logo: null,
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'lg_en',
    externalId: '39',
    name: 'Premier League',
    type: 'League',
    sport: 'soccer',
    country: 'England',
    logo: null,
    updatedAt: '2026-06-01T00:00:00Z',
  },
];

describe('filterLeaguesByQuery', () => {
  it('filters by league name or country', () => {
    expect(filterLeaguesByQuery(soccerLeagues, 'liga')).toHaveLength(2);
    expect(filterLeaguesByQuery(soccerLeagues, 'spain')).toHaveLength(1);
  });
});

describe('SportView — soccer leagues', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows only the search UI before a search is submitted', async () => {
    installFetch([
      {
        match: '/v1/sports',
        body: collection([{ id: 'sp1', slug: 'soccer', name: 'Soccer' }]),
      },
      {
        match: '/v1/leagues?sport=soccer',
        body: collection(soccerLeagues, soccerLeagues.length),
      },
    ]);

    render(<SportView slug="soccer" />);

    expect(await screen.findByRole('heading', { name: 'Soccer' })).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar liga')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Liga MX/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Búsquedas recientes')).not.toBeInTheDocument();
  });

  it('loads and filters leagues only after submitting a search', async () => {
    installFetch([
      {
        match: '/v1/sports',
        body: collection([{ id: 'sp1', slug: 'soccer', name: 'Soccer' }]),
      },
      {
        match: '/v1/leagues?sport=soccer',
        body: collection(soccerLeagues, soccerLeagues.length),
      },
    ]);

    render(<SportView slug="soccer" />);
    await screen.findByRole('heading', { name: 'Soccer' });

    const input = screen.getByLabelText('Buscar liga');
    fireEvent.change(input, { target: { value: 'mexico' } });
    fireEvent.submit(input.closest('form')!);

    expect(await screen.findByText(/Resultados para “mexico”/i)).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Liga MX/i })).toHaveAttribute('href', '/liga-mx');
    expect(screen.queryByRole('link', { name: /La Liga/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Premier League/i })).not.toBeInTheDocument();
  });

  it('stores the last five searches after submitting the form', async () => {
    installFetch([
      {
        match: '/v1/sports',
        body: collection([{ id: 'sp1', slug: 'soccer', name: 'Soccer' }]),
      },
      {
        match: '/v1/leagues?sport=soccer',
        body: collection(soccerLeagues, soccerLeagues.length),
      },
    ]);

    render(<SportView slug="soccer" />);
    await screen.findByRole('heading', { name: 'Soccer' });

    const input = screen.getByLabelText('Buscar liga');
    fireEvent.change(input, { target: { value: 'liga mx' } });
    fireEvent.submit(input.closest('form')!);
    await screen.findByRole('link', { name: /Liga MX/i });

    fireEvent.change(input, { target: { value: 'spain' } });
    fireEvent.submit(input.closest('form')!);

    expect(await screen.findByText('Búsquedas recientes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'spain' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'liga mx' })).toBeInTheDocument();

    expect(readRecentSearches(recentSearchStorageKey('soccer'))).toEqual(['spain', 'liga mx']);
  });

  it('shows results when selecting a recent search', async () => {
    localStorage.setItem(
      recentSearchStorageKey('soccer'),
      JSON.stringify(['mexico']),
    );

    installFetch([
      {
        match: '/v1/sports',
        body: collection([{ id: 'sp1', slug: 'soccer', name: 'Soccer' }]),
      },
      {
        match: '/v1/leagues?sport=soccer',
        body: collection(soccerLeagues, soccerLeagues.length),
      },
    ]);

    render(<SportView slug="soccer" />);
    await screen.findByText('Búsquedas recientes');

    fireEvent.click(screen.getByRole('button', { name: 'mexico' }));

    expect(await screen.findByText(/Resultados para “mexico”/i)).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Liga MX/i })).toBeInTheDocument();
  });

  it('shows an error when the sport is not found', async () => {
    installFetch([
      {
        match: '/v1/sports',
        body: collection([{ id: 'sp1', slug: 'soccer', name: 'Soccer' }]),
      },
    ]);

    render(<SportView slug="unknown" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Deporte no encontrado.');
  });
});
