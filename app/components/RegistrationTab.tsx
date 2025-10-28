'use client';

import { useState, useRef } from 'react';
import { useTournament } from '@/app/contexts/TournamentContext';
import type { Racer } from '@/types';

export function RegistrationTab() {
  const {state, addRacer, updateRacer, deleteRacer} = useTournament();

  const [name, setName] = useState('');
  const [team, setTeam] = useState('');
  const [weight, setWeight] = useState('');
  const [editingRacer, setEditingRacer] = useState<Racer | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Check if any races have been run (for delete restriction)
  const hasRacesRun = state.heats.some(h => h.races.some(r => r.completedAt));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    if (editingRacer) {
      // Update existing racer
      updateRacer(editingRacer.id, {
        name: name.trim(),
        team: team.trim() || undefined,
        weight: weight ? parseFloat(weight) : undefined,
      });
      setEditingRacer(null);
    } else {
      // Add new racer
      addRacer(
          name.trim(),
          team.trim() || undefined,
          weight ? parseFloat(weight) : undefined
      );
    }

    // Clear form
    setName('');
    setTeam('');
    setWeight('');

    // Focus the name input for quick entry of next racer
    nameInputRef.current?.focus();
  };

  const handleEdit = (racer: Racer) => {
    setEditingRacer(racer);
    setName(racer.name);
    setTeam(racer.team || '');
    setWeight(racer.weight?.toString() || '');
  };

  const handleCancelEdit = () => {
    setEditingRacer(null);
    setName('');
    setTeam('');
    setWeight('');
  };

  const handleDelete = (racerId: string) => {
    if (confirm('Are you sure you want to delete this racer?')) {
      deleteRacer(racerId);
    }
  };

  const handleToggleWithdrawn = (racer: Racer) => {
    const action = racer.withdrawn ? 'reinstate' : 'withdraw';
    if (confirm(`Are you sure you want to ${action} ${racer.name}?`)) {
      updateRacer(racer.id, {withdrawn: !racer.withdrawn});
    }
  };

  return (
      <div className="max-w-6xl">
        <h2 className="text-xl font-semibold mb-2">Racer Registration</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add/Edit Racer Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">
              {editingRacer ? 'Edit Racer' : 'Add Racer'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Racer Name <span className="text-red-500">*</span>
                </label>
                <input
                    ref={nameInputRef}
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter scout name"
                />
              </div>

              <div>
                <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-1">
                  Team
                </label>
                <input
                    id="team"
                    type="text"
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Den / Six / Posse (Optional)"
                />
              </div>

              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                  Car Weight
                </label>
                <input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                />
              </div>

              <div className="flex gap-2">
                <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingRacer ? 'Update Racer' : 'Add Racer'}
                </button>
                {editingRacer && (
                    <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                )}
              </div>
            </form>
          </div>

          {/* Racer List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">
              Registered Racers ({state.racers.length})
            </h3>

            {state.racers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No racers registered yet. Add racers using the form.
                </p>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {state.racers
                      .sort((a, b) => a.carNumber - b.carNumber)
                      .map((racer) => (
                          <div
                              key={racer.id}
                              className={`flex items-center justify-between p-3 border rounded-md ${
                                  racer.withdrawn
                                      ? 'border-orange-300 bg-orange-50 opacity-70'
                                      : 'border-gray-200 hover:bg-gray-50'
                              }`}
                          >
                            <div className="flex-1">
                              <div
                                  className={`font-medium ${racer.withdrawn ? 'line-through text-gray-500' : ''}`}>
                                #{racer.carNumber} - {racer.name}
                                {racer.withdrawn && <span
                                    className="ml-2 text-xs font-bold text-orange-600">WITHDRAWN</span>}
                              </div>
                              <div className="text-sm text-gray-500">
                                {racer.team && <span>{racer.team}</span>}
                                {racer.team && racer.weight && <span> • </span>}
                                {racer.weight && <span>Weight: {racer.weight}</span>}
                                {racer.races > 0 && (
                                  <>
                                    {(racer.team || racer.weight) && <span> • </span>}
                                    <span>{racer.races} race{racer.races !== 1 ? 's' : ''}, {racer.points} pt{racer.points !== 1 ? 's' : ''}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 ml-4">
                              <button
                                  onClick={() => handleEdit(racer)}
                                  className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                  onClick={() => handleToggleWithdrawn(racer)}
                                  className={`px-3 py-1 text-sm border rounded hover:bg-opacity-10 transition-colors ${
                                      racer.withdrawn
                                          ? 'border-green-600 text-green-600 hover:bg-green-50'
                                          : 'border-orange-600 text-orange-600 hover:bg-orange-50'
                                  }`}
                              >
                                {racer.withdrawn ? 'Reinstate' : 'Withdraw'}
                              </button>
                              {!hasRacesRun && (
                                  <button
                                      onClick={() => handleDelete(racer.id)}
                                      className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50 transition-colors"
                                  >
                                    Delete
                                  </button>
                              )}
                            </div>
                          </div>
                      ))}
                </div>
            )}

            {hasRacesRun && (
                <p className="mt-4 text-sm text-amber-600 bg-amber-50 p-3 rounded">
                  Racers can be edited or withdrawn, but cannot be deleted after races have been
                  run.
                </p>
            )}
          </div>
        </div>
      </div>
  );
}
