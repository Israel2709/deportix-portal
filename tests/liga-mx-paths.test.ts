import { describe, expect, it } from 'vitest';
import {
  ligaMxMatchDetailPath,
  ligaMxSeasonDetailPath,
  ligaMxStandingDetailPath,
  ligaMxTabPath,
  ligaMxTeamDetailPath,
  ligaMxTournamentDetailPath,
  parseLigaMxTab,
  truncateRecordId,
} from '@/lib/liga-mx-paths';

describe('liga-mx-paths', () => {
  it('parses tab query values', () => {
    expect(parseLigaMxTab(null)).toBe('contenido');
    expect(parseLigaMxTab('calendario')).toBe('calendario');
    expect(parseLigaMxTab('unknown')).toBe('contenido');
  });

  it('builds tab paths', () => {
    expect(ligaMxTabPath('contenido')).toBe('/liga-mx');
    expect(ligaMxTabPath('calendario')).toBe('/liga-mx?tab=calendario');
  });

  it('truncates long record ids', () => {
    expect(truncateRecordId('abc')).toBe('abc');
    expect(truncateRecordId('abcdefghijklmnop')).toBe('abcdefgh…');
  });

  it('builds detail paths', () => {
    expect(ligaMxTeamDetailPath('team-1')).toBe('/liga-mx/equipos/team-1');
    expect(ligaMxSeasonDetailPath('season-1')).toBe('/liga-mx/temporadas/season-1');
    expect(ligaMxMatchDetailPath('match-1')).toBe('/liga-mx/partidos/match-1');
    expect(
      ligaMxMatchDetailPath('match-1', { seasonId: 's1', year: 2024 }),
    ).toBe('/liga-mx/partidos/match-1?seasonId=s1&year=2024');
    expect(ligaMxStandingDetailPath('team-1', { season: 2024 })).toBe(
      '/liga-mx/clasificacion/team-1?season=2024',
    );
    expect(ligaMxTournamentDetailPath(2024, 'Clausura')).toBe(
      '/liga-mx/torneos/2024/Clausura',
    );
  });
});
