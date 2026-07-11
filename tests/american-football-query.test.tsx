import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AmericanFootballLeaguesBrowse } from '@/components/views/american-football/AmericanFootballLeaguesBrowse';
import { renderWithQueryClient } from './helpers/query-client';

afterEach(() => vi.unstubAllGlobals());

const bffEnvelope = (response: unknown[]) => ({
  get: 'leagues',
  parameters: [],
  errors: [],
  results: response.length,
  response,
});

describe('AmericanFootballLeaguesBrowse BFF', () => {
  it('renders leagues from /american-football/leagues', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown) => {
        const url = String(input);
        if (!url.includes('/american-football/leagues')) {
          throw new Error(`Unexpected fetch ${url}`);
        }
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify(
              bffEnvelope([
                {
                  league: {
                    id: '1',
                    name: 'NFL',
                    type: 'league',
                    logo: null,
                    altLogo: null,
                  },
                  country: { name: 'USA', code: 'US', flag: null },
                  seasons: [{ year: 2026, current: true }],
                },
              ]),
            ),
          headers: { get: () => null },
        };
      }),
    );

    renderWithQueryClient(<AmericanFootballLeaguesBrowse />);

    expect(await screen.findByRole('link', { name: /NFL/i })).toHaveAttribute(
      'href',
      '/american-football/leagues/1',
    );
  });
});
