'use client';

import { useMemo, useState } from 'react';
import {
  API_BASE_URL,
  EXPLORER_ENDPOINTS,
  buildPath,
  rawRequest,
  type RawResponse,
} from '@/lib/api';
import { Card, SectionTitle } from '@/components/ui/Ui';
import { ErrorState } from '@/components/states/States';

export function Explorer() {
  const [endpointId, setEndpointId] = useState(EXPLORER_ENDPOINTS[0]!.id);
  const [values, setValues] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RawResponse | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);

  const endpoint = useMemo(
    () => EXPLORER_ENDPOINTS.find((e) => e.id === endpointId) ?? EXPLORER_ENDPOINTS[0]!,
    [endpointId],
  );
  const path = buildPath(endpoint, values);
  const missingRequired = endpoint.params.some(
    (p) => p.required && !(values[p.name] ?? '').trim(),
  );

  async function run() {
    setRunning(true);
    setFatal(null);
    setResult(null);
    try {
      setResult(await rawRequest(path));
    } catch (err) {
      setFatal(err instanceof Error ? err.message : 'La solicitud falló (error de red).');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-50">Explorador de API</h1>
        <p className="mt-2 text-slate-400">
          Ejecuta solicitudes contra la API pública de Deportix. Solo están disponibles los
          endpoints definidos por la API — esto no es una consola HTTP arbitraria.{' '}
          <a
            href={`${API_BASE_URL}/docs`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:underline"
          >
            Referencia completa ↗
          </a>
        </p>
      </section>

      <Card>
        <label className="block text-sm font-medium text-slate-200" htmlFor="endpoint">
          Endpoint
        </label>
        <select
          id="endpoint"
          value={endpointId}
          onChange={(e) => {
            setEndpointId(e.target.value);
            setValues({});
            setResult(null);
            setFatal(null);
          }}
          className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
        >
          {EXPLORER_ENDPOINTS.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>

        {endpoint.params.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {endpoint.params.map((param) => (
              <div key={param.name}>
                <label
                  className="block text-xs font-medium text-slate-300"
                  htmlFor={`param-${param.name}`}
                >
                  {param.name}
                  {param.required && <span className="text-red-400"> *</span>}
                  <span className="ml-1 text-slate-500">({param.in})</span>
                </label>
                <input
                  id={`param-${param.name}`}
                  value={values[param.name] ?? ''}
                  placeholder={param.placeholder}
                  onChange={(e) => setValues((v) => ({ ...v, [param.name]: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100"
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={run}
            disabled={running || missingRequired}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? 'Ejecutando…' : 'Ejecutar solicitud'}
          </button>
          <code className="truncate rounded bg-slate-950 px-2 py-1 text-xs text-slate-400">
            GET {path}
          </code>
        </div>
        {missingRequired && (
          <p className="mt-2 text-xs text-amber-400">Completa los parámetros de ruta obligatorios.</p>
        )}
      </Card>

      {fatal && <ErrorState message={fatal} onRetry={run} />}

      {result && (
        <section className="space-y-3">
          <SectionTitle>Respuesta</SectionTitle>
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              Estado:{' '}
              <strong className={result.ok ? 'text-emerald-400' : 'text-red-400'}>
                {result.status}
              </strong>
            </span>
            <span className="text-slate-400">~{result.durationMs} ms</span>
          </div>
          {Object.keys(result.headers).length > 0 && (
            <div className="text-xs text-slate-400">
              {Object.entries(result.headers).map(([k, v]) => (
                <div key={k}>
                  <span className="text-slate-500">{k}:</span> {v}
                </div>
              ))}
            </div>
          )}
          <pre className="max-h-[28rem] overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs text-slate-200">
            {JSON.stringify(result.body, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
