'use client';

import { useState } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import { Card } from '@/components/ui/Ui';
import { TennisEntrySection } from './TennisEntrySection';
import { TennisMatchSection } from './TennisMatchSection';
import { TennisPlayerSection } from './TennisPlayerSection';
import { TennisPublishSection } from './TennisPublishSection';
import { TennisResultSection } from './TennisResultSection';
import { TennisRoundSection } from './TennisRoundSection';
import { TennisTournamentSection } from './TennisTournamentSection';

const STEPS = [
  { id: 'players', label: 'Jugadores', step: 1 },
  { id: 'tournaments', label: 'Torneos', step: 2 },
  { id: 'rounds', label: 'Rondas', step: 3 },
  { id: 'entries', label: 'Entradas', step: 4 },
  { id: 'matches', label: 'Partidos', step: 5 },
  { id: 'results', label: 'Resultados', step: 6 },
  { id: 'publish', label: 'Publicar', step: 7 },
] as const;

type StepId = (typeof STEPS)[number]['id'];

export function TennisDataLoader({ onDataChanged }: { onDataChanged?: () => void }) {
  const [activeStep, setActiveStep] = useState<StepId>('players');

  return (
    <div className="space-y-6">
      <Card className="border-blue-500/20 bg-blue-950/20">
        <p className="text-sm text-slate-200">
          <strong className="text-blue-300">Orden recomendado:</strong> jugadores → torneo (se
          puede publicar sin draw) → rondas (se pueden publicar con contendientes TBD) → entradas
          al Main Draw → partidos (bracket, incluso TBD) → resultados → publicación puntual.
          Los GET del backoffice usan <code className="text-xs">published=all</code>.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Referencia OpenAPI:{' '}
          <a
            href={`${getApiBaseUrl()}/docs?tag=bff-tennis`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:underline"
          >
            {getApiBaseUrl()}/docs
          </a>{' '}
          (tag BFF Tennis)
        </p>
      </Card>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav
          className="flex shrink-0 gap-2 overflow-x-auto lg:w-48 lg:flex-col lg:overflow-visible"
          aria-label="Pasos de carga"
        >
          {STEPS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveStep(item.id)}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-left text-sm font-medium transition lg:w-full ${
                activeStep === item.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="text-xs opacity-70">{item.step}.</span> {item.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {activeStep === 'players' && (
            <TennisPlayerSection step={1} onDataChanged={onDataChanged} />
          )}
          {activeStep === 'tournaments' && (
            <TennisTournamentSection step={2} onDataChanged={onDataChanged} />
          )}
          {activeStep === 'rounds' && (
            <TennisRoundSection step={3} onDataChanged={onDataChanged} />
          )}
          {activeStep === 'entries' && (
            <TennisEntrySection step={4} onDataChanged={onDataChanged} />
          )}
          {activeStep === 'matches' && (
            <TennisMatchSection step={5} onDataChanged={onDataChanged} />
          )}
          {activeStep === 'results' && (
            <TennisResultSection step={6} onDataChanged={onDataChanged} />
          )}
          {activeStep === 'publish' && (
            <TennisPublishSection step={7} onDataChanged={onDataChanged} />
          )}
        </div>
      </div>
    </div>
  );
}
