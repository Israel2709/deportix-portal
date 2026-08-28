'use client';

import { Card } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';
import { AmericanFootballAccordion } from '@/components/views/american-football/AmericanFootballAccordion';
import { truncateCanonicalId } from '@/lib/tennis-forms/shared';
import { useTennisContenidoQuery } from '@/lib/query/tennis/hooks';
import { TennisLoaderLink } from './TennisLoaderLink';

const CATEGORY_LABELS: Record<string, string> = {
  grand_slam: 'Grand Slam',
  atp_1000: 'ATP 1000',
  wta_1000: 'WTA 1000',
};

export function TennisContenidoTab() {
  const data = useTennisContenidoQuery();

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Contenido cargado vía BFF <code className="text-xs text-slate-500">/tennis/*</code> (incluye
        borradores con <code className="text-xs text-slate-500">published=all</code>).
      </p>

      <DataSection
        loading={data.loading}
        error={data.error}
        isEmpty={
          !data.loading &&
          !data.error &&
          data.tournaments.length === 0 &&
          data.players.length === 0
        }
        onRetry={data.reload}
        emptyTitle="Aún no hay contenido cargado"
        emptyHint="Usa la pestaña Carga de datos para registrar jugadores, torneos y el Main Draw."
        emptyAction={<TennisLoaderLink />}
      >
        <div className="space-y-3">
          <AmericanFootballAccordion title="Torneos" count={data.tournaments.length} defaultOpen>
            {data.tournaments.length === 0 ? (
              <p className="text-sm text-slate-500">Sin torneos.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {data.tournaments.map((item) => (
                  <Card key={item.id} className="space-y-1">
                    <p className="font-medium text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.year} · {CATEGORY_LABELS[item.category] ?? item.category} ·{' '}
                      {item.gender === 'male' ? 'Masculino' : 'Femenino'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.startDate} — {item.endDate} · {item.status}
                      {item.published ? ' · publicado' : ' · borrador'}
                    </p>
                    <p className="font-mono text-[11px] text-slate-600" title={item.id}>
                      {truncateCanonicalId(item.id)}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion title="Jugadores" count={data.players.length}>
            {data.players.length === 0 ? (
              <p className="text-sm text-slate-500">Sin jugadores.</p>
            ) : (
              <ul className="space-y-2">
                {data.players.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200"
                  >
                    {item.displayName} ({item.fullName}) · {item.country.code}
                    {item.published ? '' : ' · borrador'}
                  </li>
                ))}
              </ul>
            )}
          </AmericanFootballAccordion>
        </div>
      </DataSection>
    </div>
  );
}
