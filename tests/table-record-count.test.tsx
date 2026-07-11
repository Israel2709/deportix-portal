import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableRecordCount } from '@/components/ui/TableRecordCount';

describe('TableRecordCount', () => {
  it('shows total count when all records are visible', () => {
    render(<TableRecordCount shown={5} total={5} singular="partido" plural="partidos" />);
    expect(screen.getByText('5 partidos')).toBeInTheDocument();
  });

  it('shows filtered count when some records are hidden', () => {
    render(<TableRecordCount shown={1} total={5} singular="partido" plural="partidos" />);
    expect(screen.getByText('Mostrando 1 partido de 5 partidos')).toBeInTheDocument();
  });
});
