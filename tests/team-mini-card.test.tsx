import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TeamMiniCard } from '@/components/teams/TeamMiniCard';
import type { Team } from '@/lib/types';

const team: Team = {
  id: 't1',
  externalId: null,
  sport: 'soccer',
  leagueId: 'lg1',
  name: 'Club América',
  code: null,
  country: null,
  logo: 'logo.png',
  altName: 'Las Águilas',
  altLogo: 'alt.png',
  city: null,
  conference: null,
  division: null,
  venue: { id: null, name: 'Azteca', city: null, capacity: null },
  updatedAt: null,
};

describe('TeamMiniCard', () => {
  it('shows alt name and edit link', () => {
    render(<TeamMiniCard team={team} leagueId="262" hasOverride />);

    expect(screen.getByText('Las Águilas')).toBeInTheDocument();
    expect(screen.getByText('Club América')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /editar las águilas/i })).toHaveAttribute(
      'href',
      '/leagues/262/equipos/t1/editar',
    );
    expect(screen.getByText('Editado localmente')).toBeInTheDocument();
  });
});
