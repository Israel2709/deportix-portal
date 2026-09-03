'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { TennisMatchItem, TennisRoundItem } from '@/lib/tennis-bff-types';
import {
  buildTennisBracketColumns,
  tennisCompetitorLabel,
  tennisMatchWinner,
} from '@/lib/tennis-bracket';
import { tennisMatchDetailPath, tennisRoundDetailPath } from '@/lib/tennis-paths';
import { TennisLoaderLink } from './TennisLoaderLink';

function matchStatusHint(match: TennisMatchItem): string | null {
  if (match.status === 'live') return 'En vivo';
  if (match.status === 'finished' || match.status === 'retirement' || match.status === 'walkover') {
    return 'Finalizado';
  }
  if (!match.published) return 'Borrador';
  return null;
}

function MatchSlot({ match }: { match: TennisMatchItem }) {
  const c1 = tennisCompetitorLabel(match.competitor1, match.bracket.competitor1EntryType);
  const c2 = tennisCompetitorLabel(match.competitor2, match.bracket.competitor2EntryType);
  const winner = tennisMatchWinner(match);
  const hint = matchStatusHint(match);
  const score = match.result?.finalScoreDisplay?.trim() || null;

  return (
    <Link
      href={tennisMatchDetailPath(match.id)}
      className="block w-44 rounded-md border border-slate-700 bg-slate-950/80 p-2 text-left transition hover:border-blue-500/50 hover:bg-slate-900"
    >
      <div className="space-y-1 text-xs">
        <p
          className={`truncate ${
            winner?.id === match.competitor1?.id ? 'font-semibold text-slate-50' : 'text-slate-200'
          }`}
        >
          {c1}
        </p>
        <p
          className={`truncate ${
            winner?.id === match.competitor2?.id ? 'font-semibold text-slate-50' : 'text-slate-200'
          }`}
        >
          {c2}
        </p>
      </div>
      {(score || hint) && (
        <p className="mt-1 truncate text-[10px] text-slate-500">
          {[score, hint].filter(Boolean).join(' · ')}
        </p>
      )}
    </Link>
  );
}

function shouldUsePairConnectors(currentCount: number, nextCount: number): boolean {
  if (currentCount < 2 || nextCount < 1) return false;
  return nextCount === Math.ceil(currentCount / 2);
}

export function TennisBracket({
  rounds,
  matches,
}: {
  rounds: TennisRoundItem[];
  matches: TennisMatchItem[];
}) {
  const model = useMemo(() => buildTennisBracketColumns(rounds, matches), [rounds, matches]);

  if (matches.length === 0) {
    return (
      <div className="space-y-3 rounded-md border border-slate-800 bg-slate-900/40 px-4 py-6">
        <p className="text-sm text-slate-400">Aún no hay partidos para armar el Main Draw.</p>
        <TennisLoaderLink />
      </div>
    );
  }

  const finalColumn = model.columns[model.columns.length - 1];
  const finalSlot =
    finalColumn?.slots.find((slot) => slot.match.id === model.finalMatch?.id) ??
    finalColumn?.slots[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-200">Main Draw</h3>
        <p className="text-xs text-slate-500">
          {model.columns.length} ronda(s) · {matches.length} partido(s)
        </p>
      </div>

      {model.hasIrregularProgression && (
        <p className="rounded-md border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-200/90">
          Algunas rondas no reducen a la mitad los partidos respecto a la anterior. En un Main Draw
          lineal cada ronda debe tener la mitad de enfrentamientos (ganadores de la ronda previa).
        </p>
      )}

      <div className="overflow-x-auto rounded-md border border-slate-800 bg-slate-950/40 p-4">
        <div className="flex items-start gap-0" style={{ minHeight: model.totalHeightPx + 32 }}>
          {model.columns.map((column, columnIndex) => {
            const next = model.columns[columnIndex + 1];
            const pairMode = next
              ? shouldUsePairConnectors(column.slots.length, next.slots.length)
              : false;

            return (
              <div key={column.round?.id ?? `round-${column.roundNumber}`} className="flex shrink-0">
                <div className="w-48">
                  <div className="mb-3 h-8">
                    {column.round ? (
                      <Link
                        href={tennisRoundDetailPath(column.round.id)}
                        className="block truncate text-xs font-medium uppercase tracking-wide text-blue-400 hover:underline"
                      >
                        {column.roundName}
                        <span className="ml-1 font-normal text-slate-600">
                          ({column.slots.length})
                        </span>
                      </Link>
                    ) : (
                      <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">
                        {column.roundName} ({column.slots.length})
                      </p>
                    )}
                  </div>

                  <div className="relative" style={{ height: model.totalHeightPx }}>
                    {column.slots.map((slot) => (
                      <div
                        key={slot.match.id}
                        className="absolute left-0 flex items-center"
                        style={{
                          top: slot.offsetTopPx,
                          height: column.slotUnitPx,
                        }}
                      >
                        <MatchSlot match={slot.match} />
                      </div>
                    ))}
                  </div>
                </div>

                {next && (
                  <div
                    className="relative w-8 shrink-0"
                    style={{ marginTop: 32, height: model.totalHeightPx }}
                    aria-hidden
                  >
                    {column.slots.map((slot) => {
                      const midY = slot.offsetTopPx + column.slotUnitPx / 2;

                      if (!pairMode) {
                        return (
                          <div
                            key={`wire-${slot.match.id}`}
                            className="absolute left-0 w-8 border-t border-slate-600"
                            style={{ top: midY }}
                          />
                        );
                      }

                      const isTopOfPair = slot.index % 2 === 0;
                      const pairPartner = column.slots[slot.index + (isTopOfPair ? 1 : -1)];
                      const partnerMid = pairPartner
                        ? pairPartner.offsetTopPx + column.slotUnitPx / 2
                        : midY;
                      const joinY = (midY + partnerMid) / 2;

                      return (
                        <div key={`wire-${slot.match.id}`}>
                          <div
                            className="absolute left-0 w-4 border-t border-slate-600"
                            style={{ top: midY }}
                          />
                          {isTopOfPair && pairPartner && (
                            <div
                              className="absolute left-4 w-px border-l border-slate-600"
                              style={{
                                top: Math.min(midY, partnerMid),
                                height: Math.abs(partnerMid - midY),
                              }}
                            />
                          )}
                          {isTopOfPair && (
                            <div
                              className="absolute left-4 w-4 border-t border-slate-600"
                              style={{ top: joinY }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {(model.champion || model.finalMatch) && finalSlot && finalColumn && (
            <div className="relative ml-2 w-44 shrink-0" style={{ height: model.totalHeightPx + 32 }}>
              <div className="mb-3 h-8">
                <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">
                  Campeón
                </p>
              </div>
              <div
                className="absolute left-0 flex items-center"
                style={{
                  top: 32 + finalSlot.offsetTopPx,
                  height: finalColumn.slotUnitPx,
                }}
              >
                <div className="w-full rounded-md border border-amber-500/40 bg-amber-950/20 px-3 py-3 text-sm text-slate-100">
                  {model.champion ? (
                    <p className="font-semibold">{model.champion.displayName}</p>
                  ) : (
                    <p className="text-slate-500">Por definir</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
