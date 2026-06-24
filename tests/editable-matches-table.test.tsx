import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EditableMatchesTable } from '@/components/views/EditableMatchesTable';
import type { Match } from '@/lib/types';

const match: Match = {
  id: 'api_1',
  externalId: '100',
  sport: 'soccer',
  leagueId: 'lg_mx',
  seasonId: 'se25',
  date: '2026-07-01T20:00:00.000Z',
  status: 'NS',
  round: '1',
  venue: 'Azteca',
  home: { teamId: 't1', name: 'América', logo: null, score: null },
  away: { teamId: 't2', name: 'Chivas', logo: null, score: null },
  updatedAt: null,
};

describe('EditableMatchesTable', () => {
  it('shows save actions after editing score and status', () => {
    const onSave = vi.fn(() => null);

    render(
      <EditableMatchesTable
        matches={[match]}
        overrides={{}}
        resetKey="lg_mx:se25"
        onSave={onSave}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Estado de América vs Chivas/i), {
      target: { value: 'FT' },
    });
    fireEvent.change(screen.getByLabelText(/Goles de América/i), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText(/Goles de Chivas/i), {
      target: { value: '1' },
    });

    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(onSave).toHaveBeenCalledWith({
      api_1: {
        status: 'FT',
        homeScore: 2,
        awayScore: 1,
      },
    });
  });
});
