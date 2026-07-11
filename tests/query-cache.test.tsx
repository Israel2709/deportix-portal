import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLeagueSeasonsQuery } from '@/lib/query/hooks/league';
import { createTestQueryClient, QueryClientWrapper } from './helpers/query-client';
import { collection, installFetch, resource } from './helpers/mock-fetch';

afterEach(() => vi.unstubAllGlobals());

describe('query cache dedupe', () => {
  it('fetches league seasons once when two hooks mount with the same league id', async () => {
    const fetchMock = installFetch([
      {
        match: '/v1/leagues/262/seasons',
        body: collection([
          {
            id: 'se25',
            leagueId: 'lg_mx',
            year: 2025,
            current: true,
            startDate: null,
            endDate: null,
            externalId: null,
          },
        ]),
      },
    ]);

    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientWrapper client={client}>{children}</QueryClientWrapper>
    );

    const first = renderHook(() => useLeagueSeasonsQuery('262'), { wrapper });
    const second = renderHook(() => useLeagueSeasonsQuery('262'), { wrapper });

    await waitFor(() => expect(first.result.current.loading).toBe(false));
    await waitFor(() => expect(second.result.current.loading).toBe(false));

    expect(first.result.current.data).toHaveLength(1);
    expect(second.result.current.data).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('league query hook', () => {
  it('loads league resource envelope data through fetchers', async () => {
    installFetch([
      {
        match: '/v1/leagues/262',
        body: resource({
          id: 'lg_mx',
          externalId: '262',
          name: 'Liga MX',
          type: 'League',
          sport: 'soccer',
          country: 'Mexico',
          logo: null,
          altLogo: null,
          updatedAt: '2026-06-01T00:00:00Z',
        }),
      },
    ]);

    const client = createTestQueryClient();
    const { useLeagueQuery } = await import('@/lib/query/hooks/league');
    const { result } = renderHook(() => useLeagueQuery('262'), {
      wrapper: ({ children }) => <QueryClientWrapper client={client}>{children}</QueryClientWrapper>,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.name).toBe('Liga MX');
  });
});
