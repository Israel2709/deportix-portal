import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '@/lib/api';
import {
  deleteFormula1Race,
  getFormula1Race,
  getFormula1Races,
  parseFormula1ApiError,
  updateFormula1Race,
} from '@/lib/formula-1-api';
import { installFetch } from './helpers/mock-fetch';

const RACE_ID = 'a1b2c3d4-e5f6-4789-8bcd-ef1234567890';

const bffEnvelope = (response: unknown[]) => ({
  get: 'races',
  parameters: [],
  errors: [],
  results: response.length,
  response,
});

describe('parseFormula1ApiError', () => {
  it('extracts field messages from api-sports envelope', () => {
    const err = parseFormula1ApiError(
      {
        get: 'races',
        parameters: { season: '2024' },
        errors: { parameters: 'The "season" parameter is required.' },
        results: 0,
        response: [],
      },
      400,
    );
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err.message).toContain('season');
    expect(err.code).toBe('FORMULA_1_ERROR');
    expect(err.status).toBe(400);
  });

  it('falls back to generic message', () => {
    const err = parseFormula1ApiError(null, 503);
    expect(err.message).toContain('503');
  });
});

describe('formula-1 race path endpoints', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('getFormula1Race uses path id', async () => {
    const fetchMock = installFetch([
      {
        match: `/formula-1/races/${RACE_ID}`,
        body: bffEnvelope([{ id: RACE_ID, type: 'Race' }]),
      },
    ]);
    await getFormula1Race(RACE_ID);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(`/formula-1/races/${RACE_ID}`);
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('?id=');
  });

  it('getFormula1Races with only id routes to path endpoint', async () => {
    const fetchMock = installFetch([
      {
        match: `/formula-1/races/${RACE_ID}`,
        body: bffEnvelope([{ id: RACE_ID }]),
      },
    ]);
    await getFormula1Races({ id: RACE_ID });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(`/formula-1/races/${RACE_ID}`);
  });

  it('getFormula1Races with season uses collection query', async () => {
    const fetchMock = installFetch([
      {
        match: '/formula-1/races?season=2024',
        body: bffEnvelope([]),
      },
    ]);
    await getFormula1Races({ season: 2024 });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/formula-1/races?season=2024');
  });

  it('updateFormula1Race PATCHes path id', async () => {
    const fetchMock = installFetch([
      {
        match: `/formula-1/races/${RACE_ID}`,
        body: bffEnvelope([{ id: RACE_ID, status: 'Completed' }]),
      },
    ]);
    await updateFormula1Race(RACE_ID, { status: 'Completed' });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.method).toBe('PATCH');
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('?id=');
  });

  it('deleteFormula1Race DELETEs path id', async () => {
    const fetchMock = installFetch([
      {
        match: `/formula-1/races/${RACE_ID}`,
        status: 204,
        body: null,
        ok: true,
      },
    ]);
    await deleteFormula1Race(RACE_ID);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.method).toBe('DELETE');
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(`/formula-1/races/${RACE_ID}`);
  });
});
