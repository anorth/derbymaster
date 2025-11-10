'use client';

import { useEffect, useState } from 'react';
import { TournamentState } from '@/types';
import { loadTournamentState } from '@/lib/storage';
import { getCurrentStandings } from '@/lib/standings';
import { formatPlacement } from '@/lib/text';

export default function ReportPage() {
  const [state, setState] = useState<TournamentState | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const loaded = loadTournamentState();
    if (loaded) {
      setState(loaded);
    }
  }, []);

  if (!mounted) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="p-8 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 inline-block">
          <p className="text-amber-800 font-medium text-xl mb-2">No tournament data found</p>
          <p className="text-amber-600">
            No tournament data is available. Please ensure a tournament has been started.
          </p>
        </div>
      </div>
    );
  }

  const standings = getCurrentStandings(state);

  // Collect all races from heats and final
  const allRaces = [
    ...state.heats.flatMap(heat => heat.races),
    ...(state.final ? [state.final] : [])
  ].sort((a, b) => a.raceNumber - b.raceNumber);

  return (
    <div className="max-w-6xl mx-auto p-8 bg-white">
      <style jsx global>{`
        @page {
          margin: 0.75in;
        }
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
      `}</style>

      <header className="mb-8 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-bold">Derby Master Tournament Report</h1>
        <p className="text-gray-600 mt-1">
          {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
        </p>
      </header>

      {/* Racers Table */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3 border-b border-gray-400 pb-1">
          Registered Racers ({state.racers.length})
        </h2>
        <table className="w-full border-collapse border border-gray-400 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-1 text-left">Car #</th>
              <th className="border border-gray-400 px-2 py-1 text-left">Name</th>
              <th className="border border-gray-400 px-2 py-1 text-left">Team</th>
              <th className="border border-gray-400 px-2 py-1 text-center">Weight</th>
              <th className="border border-gray-400 px-2 py-1 text-center">Races</th>
              <th className="border border-gray-400 px-2 py-1 text-center">Points</th>
              <th className="border border-gray-400 px-2 py-1 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {state.racers
              .sort((a, b) => a.carNumber - b.carNumber)
              .map(racer => (
                <tr key={racer.id}>
                  <td className="border border-gray-400 px-2 py-1 font-bold">
                    {racer.carNumber}
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {racer.name}
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {racer.team || '—'}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center">
                    {racer.weight ? `${racer.weight} oz` : '—'}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center">
                    {racer.races}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center">
                    {racer.points}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center">
                    {racer.withdrawn ? 'Withdrawn' : 'Active'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>

      {/* Races Table */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3 border-b border-gray-400 pb-1">
          All Races ({allRaces.length})
        </h2>
        <table className="w-full border-collapse border border-gray-400 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-1 text-center">Heat</th>
              <th className="border border-gray-400 px-2 py-1 text-center">Race #</th>
              <th className="border border-gray-400 px-2 py-1 text-left">Lane Assignments</th>
              <th className="border border-gray-400 px-2 py-1 text-left">Results</th>
              <th className="border border-gray-400 px-2 py-1 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {allRaces.map(race => {
              const laneEntries = Object.entries(race.laneAssignments)
                .sort(([a], [b]) => parseInt(a) - parseInt(b));

              return (
                <tr key={race.id}>
                  <td className="border border-gray-400 px-2 py-1 text-center">
                    {race.isFinalRace ? 'Final' : race.heatNumber}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center font-bold">
                    {race.raceNumber}
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {laneEntries.map(([lane, racerId]) => {
                      const racer = racerId ? state.racers.find(r => r.id === racerId) : null;
                      return (
                        <span key={lane} className="mr-3">
                          L{lane}: {racer ? `#${racer.carNumber}` : '—'}
                        </span>
                      );
                    })}
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {race.completedAt && race.results ? (
                      laneEntries.map(([lane, racerId]) => {
                        const racer = racerId ? state.racers.find(r => r.id === racerId) : null;
                        const placement = race.results![parseInt(lane)];
                        return racer && placement !== undefined ? (
                          <span key={lane} className="mr-3">
                            #{racer.carNumber}: {formatPlacement(placement)}
                          </span>
                        ) : null;
                      })
                    ) : (
                      <span className="text-gray-500 italic">Not completed</span>
                    )}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-center">
                    {race.completedAt ? 'Complete' : 'Pending'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Standings Table */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3 border-b border-gray-400 pb-1">
          {state.isComplete ? 'Final Standings' : 'Current Standings'}
        </h2>
        {standings.length === 0 ? (
          <p className="text-gray-500 italic">No standings yet.</p>
        ) : (
          <table className="w-full border-collapse border border-gray-400 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-2 py-1 text-center">Rank</th>
                <th className="border border-gray-400 px-2 py-1 text-left">Racer</th>
                <th className="border border-gray-400 px-2 py-1 text-left">Team</th>
                <th className="border border-gray-400 px-2 py-1 text-center">Points</th>
                <th className="border border-gray-400 px-2 py-1 text-center">Races</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((racer, index) => {
                const isTopThree = state.isComplete && index < 3;
                return (
                  <tr
                    key={racer.id}
                    className={
                      isTopThree
                        ? index === 0
                          ? 'bg-yellow-100'
                          : index === 1
                          ? 'bg-gray-200'
                          : 'bg-orange-100'
                        : ''
                    }
                  >
                    <td className="border border-gray-400 px-2 py-1 text-center font-bold">
                      {index + 1}
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      {racer.name}{' '}
                      <span className="text-gray-600">(#{racer.carNumber})</span>
                      {racer.withdrawn && (
                        <span className="ml-2 text-xs italic text-gray-600">
                          (Withdrawn)
                        </span>
                      )}
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      {racer.team || '—'}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-center font-bold">
                      {racer.points}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-center">
                      {racer.races}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
