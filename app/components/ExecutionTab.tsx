'use client';

import { useState } from 'react';
import { useTournament } from '@/app/contexts/TournamentContext';
import { getCurrentStandings } from '@/lib/standings';
import { isEliminated } from '@/lib/tournament';

export function ExecutionTab() {
  const { state, generateNextHeat, completeRace } = useTournament();

  const [raceResults, setRaceResults] = useState<{ [lane: number]: number }>({});

  // Get current race
  const currentHeat = state.heats.find(h => h.heatNumber === state.currentHeatNumber);
  const currentRace = currentHeat?.races.find(r => !r.completedAt) || state.final;

  // Get standings
  const standings = getCurrentStandings(state);

  // Check if can generate next heat
  const canGenerateHeat = state.racers.length >= state.config.laneCount &&
    (!currentHeat || currentHeat.isComplete) &&
    !state.final &&
    !state.isComplete;

  const handleGenerateHeat = () => {
    generateNextHeat();
    setRaceResults({});
  };

  const handlePlacementChange = (lane: number, placement: string) => {
    if (!placement) {
      // Remove placement if empty
      const newResults = { ...raceResults };
      delete newResults[lane];
      setRaceResults(newResults);
    } else {
      setRaceResults({
        ...raceResults,
        [lane]: parseInt(placement),
      });
    }
  };

  const handleCompleteRace = () => {
    if (!currentRace) return;

    // Validate all lanes have results
    const requiredLanes = Object.entries(currentRace.laneAssignments)
      .filter(([_lane, racerId]) => racerId !== null)
      .map(([lane]) => parseInt(lane));

    const hasAllResults = requiredLanes.every(lane => raceResults[lane] !== undefined);

    if (!hasAllResults) {
      alert('Please enter results for all cars in the race.');
      return;
    }

    completeRace(currentRace.id, raceResults);
    setRaceResults({});
  };

  const getAvailablePlacements = (currentLane: number) => {
    if (!currentRace) return [];

    const numCars = Object.values(currentRace.laneAssignments).filter(id => id !== null).length;
    const allPlacements = Array.from({ length: numCars }, (_v, i) => i + 1);

    // Get placements used by other lanes (not this one)
    const usedByOthers = new Set(
      Object.entries(raceResults)
        .filter(([lane]) => parseInt(lane) !== currentLane)
        .map(([_lane, placement]) => placement)
    );

    return allPlacements.filter(p => !usedByOthers.has(p));
  };

  if (state.racers.length === 0) {
    return (
      <div className="max-w-6xl">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <p className="text-amber-800 font-medium mb-2">No racers registered</p>
          <p className="text-amber-600">
            Please register racers in the Registration tab before starting the tournament.
          </p>
        </div>
      </div>
    );
  }

  if (state.isComplete) {
    return (
      <div className="max-w-6xl">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Tournament Complete!</h2>
          <p className="text-green-700 mb-6">
            The final race has been completed. Check standings below for final placements.
          </p>

          {/* Final Standings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Final Standings</h3>
            <div className="space-y-2">
              {state.finalStandings?.map((racerId, index) => {
                const racer = state.racers.find(r => r.id === racerId);
                if (!racer) return null;

                return (
                  <div
                    key={racerId}
                    className={`flex items-center justify-between p-3 rounded-md ${
                      index < 3
                        ? 'bg-yellow-50 border-2 border-yellow-400'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold ${
                        index === 0 ? 'text-yellow-600' :
                        index === 1 ? 'text-gray-600' :
                        index === 2 ? 'text-orange-600' :
                        'text-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">
                          #{racer.carNumber} - {racer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {racer.points} point{racer.points !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <h2 className="text-xl font-semibold mb-6">Race Execution</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Current Race */}
        <div className="space-y-6">
          {/* Current Heat/Race Display */}
          {currentRace ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {currentRace.heatNumber === 0
                    ? `Final Race - Race #${currentRace.raceNumber}`
                    : `Heat ${currentRace.heatNumber} - Race #${currentRace.raceNumber}`}
                </h3>
              </div>

              {/* Lane Assignments */}
              <div className="space-y-3">
                {Object.entries(currentRace.laneAssignments)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([lane, racerId]) => {
                    const racer = racerId ? state.racers.find(r => r.id === racerId) : null;
                    const laneNum = parseInt(lane);
                    const availablePlacements = getAvailablePlacements(laneNum);

                    return (
                      <div
                        key={lane}
                        className="p-4 border-2 border-gray-200 rounded-md bg-white"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="text-sm font-bold text-gray-500 mb-2">
                              LANE {lane}
                            </div>
                            {racer ? (
                              <div>
                                <div className="text-lg font-bold">
                                  #{racer.carNumber} - {racer.name}
                                </div>
                                {racer.denSixPosse && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    {racer.denSixPosse}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-400 italic text-lg">Empty</div>
                            )}
                          </div>

                          {racer && (
                            <div className="w-32">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Placement
                              </label>
                              <select
                                value={raceResults[laneNum] || ''}
                                onChange={(e) => handlePlacementChange(laneNum, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select...</option>
                                {availablePlacements.map(placement => (
                                  <option key={placement} value={placement}>
                                    {placement === 1 && '1st'}
                                    {placement === 2 && '2nd'}
                                    {placement === 3 && '3rd'}
                                    {placement === 4 && '4th'}
                                    {placement > 4 && `${placement}th`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Complete Race Button */}
              <button
                onClick={handleCompleteRace}
                disabled={
                  Object.keys(raceResults).length !==
                  Object.values(currentRace.laneAssignments).filter(id => id !== null).length
                }
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Complete Race
              </button>
            </div>
          ) : canGenerateHeat ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-600 mb-4">
                {state.currentHeatNumber === 0
                  ? 'Ready to generate the first heat.'
                  : 'Current heat complete. Generate next heat to continue.'}
              </p>
              <button
                onClick={handleGenerateHeat}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Generate Next Heat
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-gray-500">
                Need at least {state.config.laneCount} racers to start the tournament.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Standings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Current Standings</h3>

          {standings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No standings yet. Start racing to see results.
            </p>
          ) : (
            <div className="space-y-2">
              {standings.map((racer, index) => {
                const eliminated = isEliminated(racer, state.config.eliminationThreshold);

                return (
                  <div
                    key={racer.id}
                    className={`flex items-center justify-between p-3 rounded-md ${
                      eliminated
                        ? 'bg-red-50 border border-red-200 opacity-60'
                        : racer.withdrawn
                        ? 'bg-orange-50 border border-orange-200 opacity-60'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-bold text-gray-400 w-6">
                        {index + 1}
                      </div>
                      <div>
                        <div className={`font-medium ${eliminated || racer.withdrawn ? 'line-through' : ''}`}>
                          #{racer.carNumber} - {racer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {racer.points} pt{racer.points !== 1 ? 's' : ''} • {racer.races} race{racer.races !== 1 ? 's' : ''}
                          {eliminated && ' • ELIMINATED'}
                          {racer.withdrawn && ' • WITHDRAWN'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
