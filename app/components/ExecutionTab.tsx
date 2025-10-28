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

  // Check if a racer has a pending race in the current heat
  const hasPendingRace = (racerId: string): boolean => {
    if (!currentHeat) return false;
    return currentHeat.races.some(race =>
      !race.completedAt &&
      Object.values(race.laneAssignments).includes(racerId)
    );
  };

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

  return (
    <div className="max-w-6xl">
      <h2 className="text-xl font-semibold mb-2">Race Execution</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Current Race */}
        <div className="space-y-6">
          {/* Current Heat/Race Display */}
          {currentRace ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
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
                        className="p-3 border border-gray-200 rounded-md bg-white"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="text-sm font-bold text-gray-500 mb-2">
                              LANE {lane}
                            </div>
                            {racer ? (
                              <div>
                                <div className="text-lg font-bold">
                                  {racer.name} <span className="text-gray-500">(#{racer.carNumber})</span>
                                </div>
                                {racer.team && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    {racer.team}
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
                  ? 'Ready to generate the first round of heats.'
                  : 'Round complete. Generate a new round of heats to continue.'}
              </p>
              <button
                onClick={handleGenerateHeat}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Generate Next Heats
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
          <h3 className="text-lg font-semibold mb-4">
            {state.isComplete ? 'Final Standings' : 'Current Standings'}
            {state.isComplete && (
              <span className="ml-3 text-sm font-normal text-green-600">Tournament Complete!</span>
            )}
          </h3>

          {standings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No standings yet. Start racing to see results.
            </p>
          ) : (
            <div className="space-y-0">
              {standings.map((racer, index) => {
                const eliminated = isEliminated(racer, state.config.eliminationThreshold);
                const isTopThree = state.isComplete && index < 3;
                const pending = !eliminated && !racer.withdrawn && hasPendingRace(racer.id);

                return (
                  <div
                    key={racer.id}
                    className={`flex items-center justify-between py-1 px-1 ${
                      isTopThree
                        ? 'bg-yellow-50'
                        : (eliminated || racer.withdrawn)
                        ? 'bg-orange-50' 
                        : index % 2 === 0
                        ? 'bg-gray-50'
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`font-bold w-5 flex-shrink-0 ${
                        isTopThree
                          ? index === 0 ? 'text-yellow-600 text-xl' :
                            index === 1 ? 'text-gray-600 text-xl' :
                            'text-amber-600 text-xl'
                          : 'text-gray-400 text-sm'
                      }`}>
                        {index + 1}
                      </div>
                      <div className={`text-lg truncate ${
                        eliminated || racer.withdrawn
                          ? 'text-gray-400 line-through'
                          : 'text-gray-700'
                      }`}>
                        {racer.name} <span className="text-gray-500">(#{racer.carNumber})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 text-md text-gray-600">
                      <div className="text-right">
                        <div>
                          {pending && <span className="mr-2">⏱️</span>}
                          <span className={pending ? 'italic text-gray-500' : ''}>{racer.points} point{racer.points !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="text-xs text-gray-500">{racer.races} race{racer.races !== 1 ? 's' : ''}</div>
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
