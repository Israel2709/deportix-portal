import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Formula1SeasonsBrowse } from '@/components/views/formula-1/Formula1SeasonsBrowse';
import { renderWithQueryClient } from './helpers/query-client';

afterEach(() => vi.unstubAllGlobals());

const bffEnvelope = (response: unknown[]) => ({
  get: 'resource',
  parameters: [],
  errors: [],
  results: response.length,
  response,
});

function installBffFetch(routes: { match: string; response: unknown[] }[]) {
  return vi.fn(async (input: unknown) => {
    const url = String(input);
    const route = routes.find((entry) => url.includes(entry.match));
    if (!route) throw new Error(`No mock route for ${url}`);
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify(bffEnvelope(route.response)),
      headers: { get: () => null },
    };
  });
}

describe('Formula1SeasonsBrowse', () => {
  it('links seasons to browse paths', async () => {
    vi.stubGlobal(
      'fetch',
      installBffFetch([{ match: '/formula-1/seasons', response: [2024, 2023] }]),
    );
    renderWithQueryClient(<Formula1SeasonsBrowse />);
    const link = await screen.findByRole('link', { name: /Temporada 2024/i });
    expect(link).toHaveAttribute('href', '/formula-1/seasons/2024');
  });

  it('shows empty state when no seasons', async () => {
    vi.stubGlobal('fetch', installBffFetch([{ match: '/formula-1/seasons', response: [] }]));
    renderWithQueryClient(<Formula1SeasonsBrowse />);
    expect(await screen.findByText('Sin temporadas')).toBeInTheDocument();
  });
});
