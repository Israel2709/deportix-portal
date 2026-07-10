'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LeagueDetail } from '@/components/views/LeagueDetail';
import { LigaMxContenidoTab } from '@/components/views/liga-mx/LigaMxContenidoTab';
import { ligaMxTabPath, parseLigaMxTab, type LigaMxTab } from '@/lib/liga-mx-paths';

function tabButtonClass(active: boolean): string {
  return active ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200';
}

export function LigaMxView({ initialTab = 'contenido' }: { initialTab?: LigaMxTab }) {
  const router = useRouter();
  const [tab, setTab] = useState<LigaMxTab>(initialTab);
  const [contenidoKey, setContenidoKey] = useState(0);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const selectTab = useCallback(
    (next: LigaMxTab) => {
      setTab(next);
      if (next === 'contenido') {
        setContenidoKey((key) => key + 1);
      }
      router.replace(ligaMxTabPath(next), { scroll: false });
    },
    [router],
  );

  return (
    <div className="space-y-8">
      {tab === 'contenido' && (
        <section>
          <h1 className="text-2xl font-bold text-slate-50">Liga MX</h1>
          <p className="mt-2 text-slate-400">
            Explora y edita el contenido cargado de la máxima categoría de México.
          </p>
        </section>
      )}

      <div className="flex gap-2 overflow-x-auto border-b border-slate-800 pb-1">
        <button
          type="button"
          onClick={() => selectTab('contenido')}
          className={`shrink-0 rounded-t-md px-4 py-2 text-sm font-medium transition ${tabButtonClass(tab === 'contenido')}`}
        >
          Contenido
        </button>
        <button
          type="button"
          onClick={() => selectTab('calendario')}
          className={`shrink-0 rounded-t-md px-4 py-2 text-sm font-medium transition ${tabButtonClass(tab === 'calendario')}`}
        >
          Calendario
        </button>
      </div>

      {tab === 'contenido' ? (
        <LigaMxContenidoTab refreshKey={contenidoKey} />
      ) : (
        <LeagueDetail
          league="262"
          title="Liga MX"
          intro="La máxima categoría de México. La temporada disponible, equipos, calendario y clasificación que aparecen abajo provienen directamente de la API — solo se muestra lo que está realmente cargado."
        />
      )}
    </div>
  );
}
