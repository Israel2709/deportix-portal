import { describe, expect, it } from 'vitest';
import {
  buildFormula1CompetitionBody,
  validateFormula1CompetitionForm,
} from '@/lib/formula-1-forms/competition-form';
import {
  buildFormula1DriverBody,
  validateFormula1DriverForm,
} from '@/lib/formula-1-forms/driver-form';
import {
  buildFormula1RaceBody,
  validateFormula1RaceForm,
} from '@/lib/formula-1-forms/race-form';
import {
  buildFormula1DriverRankingBody,
  validateFormula1DriverRankingForm,
} from '@/lib/formula-1-forms/ranking-form';

const UUID = 'a1b2c3d4-e5f6-4789-8bcd-ef1234567890';
const UUID_B = 'b2c3d4e5-f6a7-4901-8cde-f12345678901';

describe('formula-1 competition form', () => {
  it('requires name on create', () => {
    expect(validateFormula1CompetitionForm({ id: '', name: '' }, 'create')).toBe(
      'El nombre es obligatorio.',
    );
  });

  it('builds body without id', () => {
    expect(buildFormula1CompetitionBody({ id: UUID, name: ' Monaco GP ' })).toEqual({
      name: 'Monaco GP',
    });
  });
});

describe('formula-1 driver form', () => {
  it('accepts optional team id', () => {
    expect(
      validateFormula1DriverForm({ id: '', name: 'Max', number: '1', teamId: UUID }, 'create'),
    ).toBeNull();
    expect(
      buildFormula1DriverBody({ id: '', name: 'Max', number: '1', teamId: UUID }),
    ).toEqual({ name: 'Max', number: 1, teamId: UUID });
  });
});

describe('formula-1 race form', () => {
  it('requires season for query', () => {
    expect(
      validateFormula1RaceForm(
        {
          id: '',
          competitionId: '',
          circuitId: '',
          season: '',
          type: 'Race',
          date: '',
          status: 'Scheduled',
          timezone: 'utc',
          distance: '',
          lapsCurrent: '',
          lapsTotal: '',
          querySeason: '',
        },
        'query',
      ),
    ).toBe('Indica la temporada (año) para consultar.');
  });

  it('builds race body with UTC date', () => {
    const body = buildFormula1RaceBody({
      id: '',
      competitionId: UUID,
      circuitId: UUID_B,
      season: '2024',
      type: 'Race',
      date: '2024-05-26T14:00',
      status: 'Scheduled',
      timezone: 'utc',
      distance: '260 km',
      lapsCurrent: '',
      lapsTotal: '78',
      querySeason: '2024',
    });
    expect(body.competitionId).toBe(UUID);
    expect(body.circuitId).toBe(UUID_B);
    expect(body.season).toBe(2024);
    expect(body.date).toBe('2024-05-26T14:00:00.000Z');
    expect(body.laps).toEqual({ current: null, total: 78 });
  });
});

describe('formula-1 driver ranking form', () => {
  it('requires ranking id for delete', () => {
    expect(
      validateFormula1DriverRankingForm(
        {
          rankingId: '',
          driverId: UUID,
          season: '2024',
          position: '1',
          points: '25',
          wins: '',
          behind: '',
          querySeason: '2024',
        },
        'delete',
      ),
    ).toBe('El ID del ranking (UUID del documento) es obligatorio.');
  });

  it('builds ranking body', () => {
    expect(
      buildFormula1DriverRankingBody({
        rankingId: '',
        driverId: UUID,
        season: '2024',
        position: '1',
        points: '25',
        wins: '2',
        behind: '',
        querySeason: '2024',
      }),
    ).toEqual({
      driverId: UUID,
      season: 2024,
      position: 1,
      points: 25,
      wins: 2,
      behind: null,
    });
  });
});
