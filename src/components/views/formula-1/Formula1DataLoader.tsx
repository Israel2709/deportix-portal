'use client';

import { useState } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import { Card } from '@/components/ui/Ui';
import { Formula1CircuitSection } from './Formula1CircuitSection';
import { Formula1CompetitionSection } from './Formula1CompetitionSection';
import { Formula1DriverRankingSection } from './Formula1DriverRankingSection';
import { Formula1DriverSection } from './Formula1DriverSection';
import { Formula1RaceRankingSection } from './Formula1RaceRankingSection';
import { Formula1RaceSection } from './Formula1RaceSection';
import { Formula1TeamRankingSection } from './Formula1TeamRankingSection';
import { Formula1TeamSection } from './Formula1TeamSection';

const STEPS = [
  { id: 'competitions', label: 'Competiciones', step: 1 },
  { id: 'circuits', label: 'Circuitos', step: 2 },
  { id: 'teams', label: 'Equipos', step: 3 },
  { id: 'drivers', label: 'Pilotos', step: 4 },
  { id: 'races', label: 'Carreras', step: 5 },
  { id: 'driver-rankings', label: 'Clasif. pilotos', step: 6 },
  { id: 'team-rankings', label: 'Clasif. equipos', step: 7 },
  { id: 'race-rankings', label: 'Resultados', step: 8 },
] as const;

type StepId = (typeof STEPS)[number]['id'];

export function Formula1DataLoader({ onDataChanged }: { onDataChanged?: () => void }) {
  const [activeStep, setActiveStep] = useState<StepId>('competitions');

  return (
    <div className="space-y-6">
      <Card className="border-blue-500/20 bg-blue-950/20">
        <p className="text-sm text-slate-200">
          <strong className="text-blue-300">Orden recomendado:</strong> competiciones + circuitos +
          equipos → pilotos → carreras → rankings. Bodies estrictos (api-sports) — campos extra serán
          rechazados.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Referencia OpenAPI:{' '}
          <a
            href={`${getApiBaseUrl()}/docs`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:underline"
          >
            {getApiBaseUrl()}/docs
          </a>{' '}
          (tag BFF Formula 1)
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
          {activeStep === 'competitions' && (
            <Formula1CompetitionSection step={1} onDataChanged={onDataChanged} />
          )}
          {activeStep === 'circuits' && (
            <Formula1CircuitSection step={2} onDataChanged={onDataChanged} />
          )}
          {activeStep === 'teams' && <Formula1TeamSection step={3} onDataChanged={onDataChanged} />}
          {activeStep === 'drivers' && (
            <Formula1DriverSection step={4} onDataChanged={onDataChanged} />
          )}
          {activeStep === 'races' && <Formula1RaceSection step={5} onDataChanged={onDataChanged} />}
          {activeStep === 'driver-rankings' && (
            <Formula1DriverRankingSection step={6} onDataChanged={onDataChanged} />
          )}
          {activeStep === 'team-rankings' && (
            <Formula1TeamRankingSection step={7} onDataChanged={onDataChanged} />
          )}
          {activeStep === 'race-rankings' && (
            <Formula1RaceRankingSection step={8} onDataChanged={onDataChanged} />
          )}
        </div>
      </div>
    </div>
  );
}
