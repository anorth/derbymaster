'use client';

import { useState } from 'react';
import { useTournament } from '@/app/contexts/TournamentContext';

export function ConfigurationTab() {
  const { state, updateConfig, resetTournament } = useTournament();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleLaneCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateConfig({ laneCount: parseInt(e.target.value) });
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      updateConfig({ eliminationThreshold: value });
    }
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    resetTournament();
    setShowResetConfirm(false);
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold mb-6">Tournament Configuration</h2>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Lane Count */}
        <div>
          <label htmlFor="laneCount" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Lanes
          </label>
          <select
            id="laneCount"
            value={state.config.laneCount}
            onChange={handleLaneCountChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2">2 Lanes</option>
            <option value="3">3 Lanes</option>
            <option value="4">4 Lanes</option>
            <option value="5">5 Lanes</option>
            <option value="6">6 Lanes</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Number of lanes on your track
          </p>
        </div>

        {/* Elimination Threshold */}
        <div>
          <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 mb-2">
            Elimination Threshold (Points)
          </label>
          <input
            id="threshold"
            type="number"
            min="1"
            value={state.config.eliminationThreshold}
            onChange={handleThresholdChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Racers are eliminated when they reach this many points (default: 5)
          </p>
        </div>

        {/* Race Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Race Format
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-600">
            Ladderless Elimination
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Only format currently supported
          </p>
        </div>

        {/* Reset Tournament */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleResetClick}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
          >
            Reset Tournament
          </button>
          <p className="mt-2 text-sm text-gray-500">
            Clear all tournament data and start fresh
          </p>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Reset</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reset the tournament? This will delete all racers, races, and results.
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelReset}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                Yes, Reset Tournament
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
