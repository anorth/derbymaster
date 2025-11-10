'use client';

import { useEffect, useState } from 'react';
import { useTournament } from '@/app/contexts/TournamentContext';
import { getCurrentStandings } from '@/lib/standings';
import { isEliminated } from '@/lib/tournament';
import { formatPlacement } from "@/lib/text";

export default function SpectatorView() {
  const {state} = useTournament();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
    );
  }

  // Get current heat and races
  const currentHeat = state.heats.find(h => h.heatNumber === state.currentHeatNumber);
  const currentRaces = currentHeat?.races || [];
  const nextRace = currentRaces.find(r => !r.completedAt) || (state.final && !state.final.completedAt ? state.final : null);

  // Get standings
  const standings = getCurrentStandings(state);

  // Check if a racer has a pending race in the current heat or final
  const hasPendingRace = (racerId: string): boolean => {
    // Check current heat races
    if (currentHeat) {
      const hasHeatRace = currentHeat.races.some(race =>
          !race.completedAt &&
          Object.values(race.laneAssignments).includes(racerId)
      );
      if (hasHeatRace) return true;
    }

    // Check final race
    if (state.final && !state.final.completedAt) {
      return Object.values(state.final.laneAssignments).includes(racerId);
    }

    return false;
  };

  // Get race history for a racer
  const getRacerHistory = (racerId: string): number[] => {
    const placements: number[] = [];

    // Go through all heats
    for (const heat of state.heats) {
      for (const race of heat.races) {
        if (!race.completedAt || !race.results) continue;

        // Find which lane this racer was in
        const lane = Object.entries(race.laneAssignments).find(
            ([_lane, id]) => id === racerId
        )?.[0];

        if (lane && race.results[parseInt(lane)] !== undefined) {
          placements.push(race.results[parseInt(lane)]);
        }
      }
    }

    // Check final race
    if (state.final?.completedAt && state.final.results) {
      const lane = Object.entries(state.final.laneAssignments).find(
          ([_lane, id]) => id === racerId
      )?.[0];

      if (lane && state.final.results[parseInt(lane)] !== undefined) {
        placements.push(state.final.results[parseInt(lane)]);
      }
    }

    return placements;
  };

  if (state.racers.length === 0) {
    return (
        <div className="p-8 text-center">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 inline-block">
            <p className="text-amber-800 font-medium text-xl mb-2">No racers registered</p>
            <p className="text-amber-600">
              Tournament has not started yet. Please wait for registration to complete.
            </p>
          </div>
        </div>
    );
  }

  return (
      <div className="p-4 max-w-7xl mx-auto">
        {/* Current Race Callout */}
        {!state.isComplete && (
            <div className="mb-4">
              <h2 className="text-3xl font-bold text-center mb-4">Next Race</h2>

              {nextRace ? (
                  <div className="">
                    <h3 className={`text-2xl font-bold text-center mb-2 ${nextRace.isFinalRace ? "text-red-600" : "text-gray-600"}`}>
                      {nextRace.isFinalRace
                          ? `Final Race - Race #${nextRace.raceNumber}`
                          : `Heat ${nextRace.heatNumber} - Race #${nextRace.raceNumber}`}
                    </h3>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(nextRace.laneAssignments)
                          .sort(([a], [b]) => parseInt(a) - parseInt(b))
                          .map(([lane, racerId]) => {
                            const racer = racerId ? state.racers.find(r => r.id === racerId) : null;

                            return (
                                <div
                                    key={lane}
                                    className="bg-white border-1 border-gray-300 rounded-lg p-2 text-center shadow-md"
                                >
                                  <div className="text-sm font-bold text-blue-600 mb-1">
                                    LANE {lane}
                                  </div>
                                  {racer ? (
                                      <>
                                        <div className="text-3xl font-bold text-gray-800 mb-1">
                                          #{racer.carNumber}
                                        </div>
                                        <div className="text-lg font-semibold text-gray-700">
                                          {racer.name}
                                        </div>
                                        {racer.team && (
                                            <div className="text-sm text-gray-600 mt-2">
                                              {racer.team}
                                            </div>
                                        )}
                                      </>
                                  ) : (
                                      <div className="text-gray-400 italic text-lg">Empty</div>
                                  )}
                                </div>
                            );
                          })}
                    </div>
                  </div>
              ) : currentHeat && !currentHeat.isComplete ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                    <p className="text-xl text-blue-800">Heat in progress...</p>
                  </div>
              ) : (
                  <div className="text-center">
                    <p>Waiting...</p>
                  </div>
              )
              }
            </div>
        )}

        {/* Standings Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <h2 className="text-2xl font-bold p-2 bg-gray-50 border-b border-gray-200">
            {state.isComplete ? 'Final Standings' : 'Current Standings'}
          </h2>

          {standings.length === 0 ? (
              <p className="text-gray-500 text-center py-12">
                No standings yet. Waiting for races to begin.
              </p>
          ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold text-gray-700">Rank</th>
                    <th className="px-4 py-2 text-left font-bold text-gray-700">Racer</th>
                    <th className="px-4 py-2 text-left font-bold text-gray-700">Team</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">Points</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700">Races</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-700"></th>
                  </tr>
                  </thead>
                  <tbody>
                  {standings.map((racer, index) => {
                    const eliminated = isEliminated(racer, state.config.eliminationThreshold);
                    const isTopThree = state.isComplete && index < 3;
                    const history = getRacerHistory(racer.id);
                    const pending = !eliminated && !racer.withdrawn && hasPendingRace(racer.id);

                    return (
                        <tr
                            key={racer.id}
                            className={`border-b border-gray-200 ${
                                isTopThree
                                    ? index === 0
                                        ? 'bg-yellow-100'
                                        : index === 1
                                            ? 'bg-gray-100'
                                            : 'bg-orange-100'
                                    : eliminated || racer.withdrawn
                                        ? 'bg-red-50 text-gray-500'
                                        : index % 2 === 0
                                            ? 'bg-white'
                                            : 'bg-gray-50'
                            }`}
                        >
                          <td className="px-4 py-2">
                        <span
                            className={`text-lg ${
                                isTopThree
                                    ? index === 0
                                        ? 'text-yellow-600 text-2xl'
                                        : index === 1
                                            ? 'text-gray-600 text-2xl'
                                            : 'text-orange-600 text-2xl'
                                    : 'text-gray-600'
                            }`}
                        >
                          {index + 1}
                        </span>
                          </td>
                          <td className="px-4 py-2">
                        <span
                            className={`text-lg font-bold ${
                                eliminated || racer.withdrawn
                                    ? 'text-gray-500'
                                    : 'text-gray-800'
                            }`}
                        >
                          {racer.name}{' '}
                          <span className="text-gray-500 font-normal">
                            (#{racer.carNumber})
                          </span>
                          {racer.withdrawn && (
                              <span className="ml-2 text-xs font-medium italic text-gray-600">
                              (Withdrawn)
                            </span>
                          )}
                          {eliminated && !racer.withdrawn && (
                              <span className="ml-2 text-xs font-medium italic text-gray-600">
                              (Eliminated)
                            </span>
                          )}
                        </span>
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {racer.team || '—'}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {pending && <span className="mr-2">⏱️</span>}
                            <span
                                className={`text-lg font-bold ${pending ? 'italic text-gray-500' : 'text-gray-800'}`}>
                          {racer.points}
                        </span>
                          </td>
                          <td className="px-4 py-2 text-center text-gray-600">
                            {racer.races}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-1 flex-wrap">
                              {history.length > 0 ? (
                                  history.map((placement, idx) => (
                                      <span
                                          key={idx}
                                          className={`inline-block w-9 px-2 py-1 rounded text-xs font-semibold ${
                                              placement === 1
                                                  ? 'bg-yellow-200 text-yellow-800'
                                                  : placement === 2
                                                      ? 'bg-gray-200 text-gray-700'
                                                      : placement === 3
                                                          ? 'bg-orange-200 text-orange-800'
                                                          : 'bg-blue-100 text-blue-700'
                                          }`}
                                      >
                                {formatPlacement(placement)}
                              </span>
                                  ))
                              ) : (
                                  <span className="text-gray-400 text-sm">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
          )}
        </div>
      </div>
  );
}
