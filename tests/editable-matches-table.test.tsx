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

function clickCell(text: string | RegExp) {
  fireEvent.click(screen.getByText(text));
}

describe('EditableMatchesTable', () => {
  it('filters matches with the search field', () => {
    const otherMatch: Match = {
      ...match,
      id: 'api_2',
      home: { teamId: 't3', name: 'Cruz Azul', logo: null, score: null },
      away: { teamId: 't4', name: 'Pumas', logo: null, score: null },
    };

    render(
      <EditableMatchesTable
        matches={[match, otherMatch]}
        resetKey="lg_mx:se25"
        onSave={vi.fn(() => null)}
        onDelete={vi.fn(() => null)}
      />,
    );

    expect(screen.getByText('América')).toBeInTheDocument();
    expect(screen.getByText('Cruz Azul')).toBeInTheDocument();
    expect(screen.getByText('2 partidos')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Buscar por equipos/i), {
      target: { value: 'cruz azul' },
    });

    expect(screen.queryByText('América')).not.toBeInTheDocument();
    expect(screen.getByText('Cruz Azul')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1 partido de 2 partidos')).toBeInTheDocument();
  });

  it('sorts matches when a column header is clicked', () => {
    const earlierMatch: Match = {
      ...match,
      id: 'api_2',
      date: '2026-06-01T18:00:00.000Z',
      home: { teamId: 't3', name: 'Cruz Azul', logo: null, score: null },
      away: { teamId: 't4', name: 'Pumas', logo: null, score: null },
    };

    render(
      <EditableMatchesTable
        matches={[match, earlierMatch]}
        resetKey="lg_mx:se25"
        onSave={vi.fn(() => null)}
        onDelete={vi.fn(() => null)}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Fecha \(UTC\)/i }));

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('Cruz Azul');
    expect(rows[1]).toHaveTextContent('América');
  });

  it('shows typed score values after clicking the score cell', () => {
    render(
      <EditableMatchesTable
        matches={[match]}
        resetKey="lg_mx:se25"
        onSave={vi.fn(() => null)}
        onDelete={vi.fn(() => null)}
      />,
    );

    clickCell('– : –');

    const homeInput = screen.getByLabelText(/Goles de América/i) as HTMLInputElement;
    fireEvent.change(homeInput, { target: { value: '3' } });
    expect(homeInput.value).toBe('3');
    expect(homeInput.type).toBe('text');
  });

  it('shows save actions after editing score and status', () => {
    const onSave = vi.fn(() => null);

    render(
      <EditableMatchesTable
        matches={[match]}
        resetKey="lg_mx:se25"
        onSave={onSave}
        onDelete={vi.fn(() => null)}
      />,
    );

    clickCell('NS');
    fireEvent.change(screen.getByLabelText(/Estado de América vs Chivas/i), {
      target: { value: 'FT' },
    });

    clickCell('– : –');
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
        date: '2026-07-01T20:00:00.000Z',
        round: '1',
        venue: 'Azteca',
        seasonId: 'se25',
        status: 'FT',
        homeTeamId: 't1',
        awayTeamId: 't2',
        homeScore: 2,
        awayScore: 1,
      },
    });
  });

  it('calls onDelete after confirming removal', async () => {
    const onDelete = vi.fn(() => null);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <EditableMatchesTable
        matches={[match]}
        resetKey="lg_mx:se25"
        onSave={vi.fn(() => null)}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Eliminar partido América vs Chivas/i }));

    expect(onDelete).toHaveBeenCalledWith('api_1');
  });
});
