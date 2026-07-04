'use client';

import { useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Card } from '@/components/ui/Ui';
import { NflCountrySection } from './NflCountrySection';
import { NflGameSection } from './NflGameSection';
import { NflLeagueSection } from './NflLeagueSection';
import { NflSeasonSection } from './NflSeasonSection';
import { NflStandingSection } from './NflStandingSection';
import { NflTeamSection } from './NflTeamSection';
import { NflTimezoneSection } from './NflTimezoneSection';

const STEPS = [
  { id: 'countries', label: 'Países', step: 1 },
  { id: 'leagues', label: 'Ligas', step: 2 },
  { id: 'seasons', label: 'Temporadas', step: 3 },
  { id: 'teams', label: 'Equipos', step: 4 },
  { id: 'games', label: 'Partidos', step: 5 },
  { id: 'standings', label: 'Clasificación', step: 6 },
  { id: 'timezone', label: 'Timezones', step: 7 },
] as const;

type StepId = (typeof STEPS)[number]['id'];

export function NflDataLoader() {
  const [activeStep, setActiveStep] = useState<StepId>('countries');

  return (
    <div className="space-y-6">
      <Card className="border-blue-500/20 bg-blue-950/20">
        <p className="text-sm text-slate-200">
          <strong className="text-blue-300">Orden recomendado:</strong> países (opcional) → ligas →
          temporadas → equipos → partidos → clasificación. Los bodies deben coincidir exactamente con
          api-sports — campos extra serán rechazados.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Referencia OpenAPI:{' '}
          <a
            href={`${API_BASE_URL}/docs`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:underline"
          >
            {API_BASE_URL}/docs
          </a>{' '}
          (tag BFF NFL)
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
          {activeStep === 'countries' && <NflCountrySection step={1} />}
          {activeStep === 'leagues' && <NflLeagueSection step={2} />}
          {activeStep === 'seasons' && <NflSeasonSection step={3} />}
          {activeStep === 'teams' && <NflTeamSection step={4} />}
          {activeStep === 'games' && <NflGameSection step={5} />}
          {activeStep === 'standings' && <NflStandingSection step={6} />}
          {activeStep === 'timezone' && <NflTimezoneSection step={7} />}
        </div>
      </div>
    </div>
  );
}
