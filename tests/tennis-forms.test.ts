import { describe, expect, it } from 'vitest';
import {
  buildTennisPlayerBody,
  validateTennisPlayerForm,
} from '@/lib/tennis-forms/player-form';
import {
  buildTennisTournamentBody,
  validateTennisTournamentForm,
} from '@/lib/tennis-forms/tournament-form';
import {
  buildTennisMatchBody,
  validateTennisMatchForm,
} from '@/lib/tennis-forms/match-form';
import {
  buildTennisResultBody,
  validateTennisResultForm,
} from '@/lib/tennis-forms/result-form';

const UUID = 'a1b2c3d4-e5f6-4789-8bcd-ef1234567890';
const UUID_B = 'b2c3d4e5-f6a7-4901-8cde-f12345678901';

describe('tennis player form', () => {
  it('requires full and display name on create', () => {
    expect(
      validateTennisPlayerForm(
        { id: '', fullName: '', displayName: '', photoUrl: '', countryCode: '', published: 'false' },
        'create',
      ),
    ).toBe('El nombre completo es obligatorio.');
  });

  it('builds player body', () => {
    expect(
      buildTennisPlayerBody({
        id: '',
        fullName: ' Carlos Alcaraz ',
        displayName: ' Alcaraz ',
        photoUrl: '',
        countryCode: 'es',
        published: 'true',
      }),
    ).toEqual({
      fullName: 'Carlos Alcaraz',
      displayName: 'Alcaraz',
      photoUrl: null,
      countryCode: 'ES',
      published: true,
    });
  });
});

describe('tennis tournament form', () => {
  it('builds tournament body with singles event type', () => {
    const body = buildTennisTournamentBody({
      id: '',
      name: 'US Open',
      shortName: 'USO',
      category: 'grand_slam',
      gender: 'male',
      countryCode: 'US',
      city: 'New York',
      imageUrl: '',
      startDate: '2026-08-24',
      endDate: '2026-09-13',
      year: '2026',
      status: 'upcoming',
    });
    expect(body.eventType).toBe('singles');
    expect(body.year).toBe(2026);
  });

  it('requires tournament id for delete', () => {
    expect(
      validateTennisTournamentForm(
        {
          id: '',
          name: 'US Open',
          shortName: '',
          category: 'grand_slam',
          gender: 'male',
          countryCode: 'US',
          city: '',
          imageUrl: '',
          startDate: '2026-08-24',
          endDate: '2026-09-13',
          year: '2026',
          status: 'upcoming',
        },
        'delete',
      ),
    ).toBe('Selecciona un torneo de la lista para eliminar.');
  });
});

describe('tennis match form', () => {
  it('requires tournament for query', () => {
    expect(
      validateTennisMatchForm(
        {
          ...{
            id: '',
            tournamentId: '',
            roundId: '',
            bracketPosition: '1',
            competitor1Id: '',
            competitor2Id: '',
            scheduledAt: '',
            timezone: 'utc',
            court: '',
            status: 'pending_competitors',
            competitor1SourceMatchId: '',
            competitor2SourceMatchId: '',
            winnerToMatchId: '',
            winnerToPosition: '',
            competitor1EntryType: '',
            competitor2EntryType: '',
            queryTournamentId: '',
          },
        },
        'query',
      ),
    ).toBe('Selecciona un torneo para consultar partidos.');
  });

  it('builds match body with bracket fields', () => {
    const body = buildTennisMatchBody({
      id: '',
      tournamentId: UUID,
      roundId: UUID_B,
      bracketPosition: '3',
      competitor1Id: '',
      competitor2Id: '',
      scheduledAt: '',
      timezone: 'utc',
      court: '',
      status: 'pending_competitors',
      competitor1SourceMatchId: UUID,
      competitor2SourceMatchId: '',
      winnerToMatchId: UUID_B,
      winnerToPosition: 'competitor_1',
      competitor1EntryType: 'bye',
      competitor2EntryType: '',
      queryTournamentId: UUID,
    });
    expect(body.tournamentId).toBe(UUID);
    expect(body.bracketPosition).toBe(3);
    expect(body.competitor1SourceMatchId).toBe(UUID);
    expect(body.winnerToMatchId).toBe(UUID_B);
    expect(body.winnerToPosition).toBe('competitor_1');
    expect(body.competitor1EntryType).toBe('bye');
  });
});

describe('tennis result form', () => {
  it('requires winner', () => {
    expect(
      validateTennisResultForm(
        {
          matchId: UUID,
          winnerId: '',
          loserId: '',
          resultType: 'normal',
          setsPlayer1: '',
          setsPlayer2: '',
          set1Competitor1: '',
          set1Competitor2: '',
          set2Competitor1: '',
          set2Competitor2: '',
          set3Competitor1: '',
          set3Competitor2: '',
          set4Competitor1: '',
          set4Competitor2: '',
          set5Competitor1: '',
          set5Competitor2: '',
          finalScoreDisplay: '',
          startedAt: '',
          endedAt: '',
          queryTournamentId: UUID,
        },
        'create',
      ),
    ).toBe('El ganador es obligatorio.');
  });

  it('builds result body with set scores', () => {
    expect(
      buildTennisResultBody({
        matchId: UUID,
        winnerId: UUID,
        loserId: UUID_B,
        resultType: 'normal',
        setsPlayer1: '2',
        setsPlayer2: '1',
        set1Competitor1: '6',
        set1Competitor2: '4',
        set2Competitor1: '3',
        set2Competitor2: '6',
        set3Competitor1: '7',
        set3Competitor2: '5',
        set4Competitor1: '',
        set4Competitor2: '',
        set5Competitor1: '',
        set5Competitor2: '',
        finalScoreDisplay: '6-4, 3-6, 7-5',
        startedAt: '',
        endedAt: '',
        queryTournamentId: UUID,
      }),
    ).toEqual({
      winnerId: UUID,
      loserId: UUID_B,
      resultType: 'normal',
      setsPlayer1: 2,
      setsPlayer2: 1,
      setScores: [
        { set: 1, competitor1: 6, competitor2: 4 },
        { set: 2, competitor1: 3, competitor2: 6 },
        { set: 3, competitor1: 7, competitor2: 5 },
      ],
      finalScoreDisplay: '6-4, 3-6, 7-5',
      startedAt: null,
      endedAt: null,
    });
  });
});
