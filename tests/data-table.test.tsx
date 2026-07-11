import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DataTable } from '@/components/ui/DataTable';

describe('DataTable', () => {
  it('sorts rows when a sortable column header is clicked', () => {
    const rows = [
      { name: 'Cruz Azul', points: 12 },
      { name: 'América', points: 20 },
      { name: 'Chivas', points: 15 },
    ];

    render(
      <DataTable
        columns={[
          { key: 'name', header: 'Equipo', render: (row) => row.name, sortValue: (row) => row.name },
          {
            key: 'points',
            header: 'Pts',
            render: (row) => row.points,
            sortValue: (row) => row.points,
            className: 'text-right',
          },
        ]}
        rows={rows}
        rowKey={(row) => row.name}
        caption="Clasificación"
      />,
    );

    const nameHeader = screen.getByRole('button', { name: /Equipo/i });
    fireEvent.click(nameHeader);
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('América');

    fireEvent.click(nameHeader);
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Cruz Azul');

    const pointsHeader = screen.getByRole('button', { name: /Pts/i });
    fireEvent.click(pointsHeader);
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Cruz Azul');
  });
});
