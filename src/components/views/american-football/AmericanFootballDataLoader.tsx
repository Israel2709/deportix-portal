'use client';

import { useState } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import { Card } from '@/components/ui/Ui';
import { AmericanFootballGameSection } from './AmericanFootballGameSection';
import { AmericanFootballLeagueSection } from './AmericanFootballLeagueSection';
import { AmericanFootballSeasonSection } from './AmericanFootballSeasonSection';
import { AmericanFootballStandingSection } from './AmericanFootballStandingSection';
import { AmericanFootballTeamSection } from './AmericanFootballTeamSection';
import { AmericanFootballTimezoneSection } from './AmericanFootballTimezoneSection';

const STEPS = [
  { id: 'leagues', label: 'Ligas', step: 1 },
  { id: 'seasons', label: 'Temporadas', step: 2 },
  { id: 'teams', label: 'Equipos', step: 3 },
  { id: 'games', label: 'Partidos', step: 4 },
  { id: 'standings', label: 'Clasificación', step: 5 },
  { id: 'timezone', label: 'Timezones', step: 6 },
] as const;

type StepId = (typeof STEPS)[number]['id'];

export function AmericanFootballDataLoader({ onDataChanged }: { onDataChanged?: () => void }) {
  const [activeStep, setActiveStep] = useState<StepId>('leagues');

  return (
    <div className="space-y-6">
      <Card className="border-blue-500/20 bg-blue-950/20">
        <p className="text-sm text-slate-200">
          <strong className="text-blue-300">Orden recomendado:</strong> ligas → temporadas → equipos → partidos →
          clasificación. Los bodies deben coincidir exactamente con
          api-sports — campos extra serán rechazados.
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
          (tag BFF American Football)
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
          {activeStep === 'leagues' && <AmericanFootballLeagueSection step={1} onDataChanged={onDataChanged} />}
          {activeStep === 'seasons' && <AmericanFootballSeasonSection step={2} onDataChanged={onDataChanged} />}
          {activeStep === 'teams' && <AmericanFootballTeamSection step={3} onDataChanged={onDataChanged} />}
          {activeStep === 'games' && <AmericanFootballGameSection step={4} onDataChanged={onDataChanged} />}
          {activeStep === 'standings' && <AmericanFootballStandingSection step={5} onDataChanged={onDataChanged} />}
          {activeStep === 'timezone' && <AmericanFootballTimezoneSection step={6} onDataChanged={onDataChanged} />}
        </div>
      </div>
    </div>
  );
}
