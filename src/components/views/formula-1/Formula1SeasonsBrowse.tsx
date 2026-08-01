'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';
import { formula1SeasonBrowsePath } from '@/lib/formula-1-paths';
import { useFormula1SeasonsQuery } from '@/lib/query/formula-1/hooks';
import { Formula1LoaderLink } from './Formula1LoaderLink';

export function Formula1SeasonsBrowse() {
  const seasons = useFormula1SeasonsQuery();

  return (
    <DataSection
      loading={seasons.loading}
      error={seasons.error}
      isEmpty={seasons.data.length === 0}
      onRetry={seasons.reload}
      emptyTitle="Sin temporadas"
      emptyHint="Las temporadas se derivan de las carreras cargadas."
      emptyAction={<Formula1LoaderLink />}
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {seasons.data.map((year) => (
          <li key={year}>
            <Link href={formula1SeasonBrowsePath(year)} className="block">
              <Card className="transition hover:border-blue-500/40">
                <p className="font-medium text-slate-100">Temporada {year}</p>
                <p className="text-xs text-slate-400">Calendario y clasificación</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </DataSection>
  );
}
