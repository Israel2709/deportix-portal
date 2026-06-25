import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAllMatches } from '@/lib/use-all-matches';
import { collection, installFetch } from './helpers/mock-fetch';

afterEach(() => vi.unstubAllGlobals());

describe('useAllMatches', () => {
  it('fetches every page until all matches are loaded', async () => {
    const page1 = Array.from({ length: 100 }, (_, index) => ({ id: `m${index + 1}` }));
    const page2 = Array.from({ length: 53 }, (_, index) => ({ id: `m${index + 101}` }));

    installFetch([
      {
        match: '/v1/leagues/262/matches?season=2026&page=1',
        body: collection(page1, 153),
      },
      {
        match: '/v1/leagues/262/matches?season=2026&page=2',
        body: collection(page2, 153),
      },
    ]);

    const { result } = renderHook(() => useAllMatches('262', 2026));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toHaveLength(153);
    expect(result.current.error).toBeNull();
  });
});
