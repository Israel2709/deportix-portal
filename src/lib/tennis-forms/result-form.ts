import { datetimeLocalToIso, isoToDatetimeLocal } from '../match-form';
import type { TennisMatchItem, TennisMatchResultBody, TennisSetScore } from '../tennis-bff-types';
import { nullableString, parseOptionalInt, requireCanonicalId } from './shared';
import { formatTennisMatchLabel } from './match-form';

export interface TennisResultFormValues {
  matchId: string;
  winnerId: string;
  loserId: string;
  resultType: string;
  setsPlayer1: string;
  setsPlayer2: string;
  set1Competitor1: string;
  set1Competitor2: string;
  set2Competitor1: string;
  set2Competitor2: string;
  set3Competitor1: string;
  set3Competitor2: string;
  set4Competitor1: string;
  set4Competitor2: string;
  set5Competitor1: string;
  set5Competitor2: string;
  finalScoreDisplay: string;
  startedAt: string;
  endedAt: string;
  queryTournamentId: string;
}

export const EMPTY_TENNIS_RESULT_FORM: TennisResultFormValues = {
  matchId: '',
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
  queryTournamentId: '',
};

export const TENNIS_RESULT_TYPE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'retirement', label: 'Retiro' },
  { value: 'walkover', label: 'Walkover' },
  { value: 'disqualification', label: 'Descalificación' },
];

const SET_FIELDS: [keyof TennisResultFormValues, keyof TennisResultFormValues][] = [
  ['set1Competitor1', 'set1Competitor2'],
  ['set2Competitor1', 'set2Competitor2'],
  ['set3Competitor1', 'set3Competitor2'],
  ['set4Competitor1', 'set4Competitor2'],
  ['set5Competitor1', 'set5Competitor2'],
];

function parseSetScores(values: TennisResultFormValues): TennisSetScore[] | null {
  const scores: TennisSetScore[] = [];
  for (let i = 0; i < SET_FIELDS.length; i++) {
    const [c1Key, c2Key] = SET_FIELDS[i]!;
    const c1 = values[c1Key].trim();
    const c2 = values[c2Key].trim();
    if (!c1 && !c2) continue;
    const p1 = parseOptionalInt(c1);
    const p2 = parseOptionalInt(c2);
    if (p1 === 'invalid' || p2 === 'invalid' || p1 == null || p2 == null) return null;
    scores.push({ set: i + 1, competitor1: p1, competitor2: p2 });
  }
  return scores.length > 0 ? scores : null;
}

export function resultMatchToFormValues(
  match: TennisMatchItem,
  queryTournamentId = '',
): TennisResultFormValues {
  const base: TennisResultFormValues = {
    ...EMPTY_TENNIS_RESULT_FORM,
    matchId: match.id,
    queryTournamentId: queryTournamentId || match.tournamentId,
    startedAt: match.startedAt ? isoToDatetimeLocal(match.startedAt) : '',
    endedAt: match.endedAt ? isoToDatetimeLocal(match.endedAt) : '',
  };
  const result = match.result;
  if (!result) return base;
  const next: TennisResultFormValues = {
    ...base,
    winnerId: result.winnerId ?? '',
    loserId: result.loserId ?? '',
    resultType: result.resultType ?? 'normal',
    setsPlayer1: result.setsPlayer1 != null ? String(result.setsPlayer1) : '',
    setsPlayer2: result.setsPlayer2 != null ? String(result.setsPlayer2) : '',
    finalScoreDisplay: result.finalScoreDisplay ?? '',
  };
  if (result.setScores) {
    for (const score of result.setScores) {
      const idx = score.set - 1;
      if (idx >= 0 && idx < SET_FIELDS.length) {
        const [c1Key, c2Key] = SET_FIELDS[idx]!;
        next[c1Key] = String(score.competitor1);
        next[c2Key] = String(score.competitor2);
      }
    }
  }
  return next;
}

export function validateTennisResultForm(
  values: TennisResultFormValues,
  mode: 'create' | 'edit' | 'delete' | 'query',
): string | null {
  if (mode === 'query') {
    if (requireCanonicalId(values.queryTournamentId, 'Torneo') === 'invalid') {
      return 'Selecciona un torneo para consultar partidos.';
    }
    return null;
  }
  if (requireCanonicalId(values.matchId, 'Partido') === 'invalid') {
    return 'Selecciona un partido para registrar el resultado.';
  }
  if (requireCanonicalId(values.winnerId, 'Ganador') === 'invalid') {
    return 'El ganador es obligatorio.';
  }
  if (!values.resultType.trim()) return 'El tipo de resultado es obligatorio.';
  if (parseOptionalInt(values.setsPlayer1) === 'invalid') return 'Sets jugador 1 debe ser un entero.';
  if (parseOptionalInt(values.setsPlayer2) === 'invalid') return 'Sets jugador 2 debe ser un entero.';
  if (values.resultType === 'normal' && parseSetScores(values) === null) {
    const hasPartial = SET_FIELDS.some(([a, b]) => values[a].trim() || values[b].trim());
    if (hasPartial) return 'Completa los marcadores por set o déjalos vacíos.';
  }
  return null;
}

export function buildTennisResultBody(values: TennisResultFormValues): TennisMatchResultBody {
  const setsPlayer1 = parseOptionalInt(values.setsPlayer1);
  const setsPlayer2 = parseOptionalInt(values.setsPlayer2);
  return {
    winnerId: values.winnerId.trim(),
    loserId: values.loserId.trim() || undefined,
    resultType: values.resultType as TennisMatchResultBody['resultType'],
    setsPlayer1: setsPlayer1 === 'invalid' ? null : setsPlayer1,
    setsPlayer2: setsPlayer2 === 'invalid' ? null : setsPlayer2,
    setScores: parseSetScores(values),
    finalScoreDisplay: nullableString(values.finalScoreDisplay),
    startedAt: values.startedAt.trim() ? datetimeLocalToIso(values.startedAt) : null,
    endedAt: values.endedAt.trim() ? datetimeLocalToIso(values.endedAt) : null,
  };
}

export function matchResultOptions(matches: TennisMatchItem[]): { value: string; label: string }[] {
  return [
    { value: '', label: 'Selecciona un partido' },
    ...matches.map((m) => ({ value: m.id, label: formatTennisMatchLabel(m) })),
  ];
}

export function competitorOptions(match: TennisMatchItem | null): { value: string; label: string }[] {
  if (!match) return [{ value: '', label: 'Selecciona un partido primero' }];
  const options = [{ value: '', label: 'Selecciona' }];
  if (match.competitor1) {
    options.push({ value: match.competitor1.id, label: match.competitor1.displayName });
  }
  if (match.competitor2) {
    options.push({ value: match.competitor2.id, label: match.competitor2.displayName });
  }
  return options;
}
