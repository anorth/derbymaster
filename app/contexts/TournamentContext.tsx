'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { TournamentState, Heat } from '@/types';
import {
  loadTournamentState,
  saveTournamentState,
  clearTournamentState,
  onTournamentStateChange,
} from '@/lib/storage';
import {
  createInitialState,
  addRacer as addRacerUtil,
  updateRacer as updateRacerUtil,
  deleteRacer as deleteRacerUtil,
  updateConfig as updateConfigUtil,
} from '@/lib/tournament';
import { generateHeat, generateFinalRace } from '@/lib/heat-generator';
import { completeRace as completeRaceUtil } from '@/lib/standings';

interface TournamentContextType {
  state: TournamentState;
  addRacer: (name: string, denSixPosse?: string, weight?: number) => void;
  updateRacer: (racerId: string, updates: { name?: string; denSixPosse?: string; weight?: number; withdrawn?: boolean }) => void;
  deleteRacer: (racerId: string) => void;
  updateConfig: (updates: { laneCount?: number; eliminationThreshold?: number }) => void;
  resetTournament: () => void;
  generateNextHeat: () => void;
  completeRace: (raceId: string, results: { [lane: number]: number }) => void;
  updateHeat: (heat: Heat) => void;
  regenerateCurrentHeat: () => void;
}

const TournamentContext = createContext<TournamentContextType | null>(null);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TournamentState>(() => {
    const loaded = loadTournamentState();
    return loaded || createInitialState();
  });

  // Save state whenever it changes
  useEffect(() => {
    saveTournamentState(state);
  }, [state]);

  // Listen for changes from other windows
  useEffect(() => {
    const cleanup = onTournamentStateChange(() => {
      const updated = loadTournamentState();
      if (updated) {
        setState(updated);
      }
    });

    return cleanup;
  }, []);

  const addRacer = (name: string, denSixPosse?: string, weight?: number) => {
    setState(prev => addRacerUtil(prev, name, denSixPosse, weight));
  };

  const updateRacer = (racerId: string, updates: { name?: string; denSixPosse?: string; weight?: number; withdrawn?: boolean }) => {
    setState(prev => updateRacerUtil(prev, racerId, updates));
  };

  const deleteRacer = (racerId: string) => {
    setState(prev => deleteRacerUtil(prev, racerId));
  };

  const updateConfig = (updates: { laneCount?: number; eliminationThreshold?: number }) => {
    setState(prev => updateConfigUtil(prev, updates));
  };

  const resetTournament = () => {
    clearTournamentState();
    setState(createInitialState());
  };

  const generateNextHeat = () => {
    setState(prev => {
      // Check if we should generate final race
      const activeRacers = prev.racers.filter(
        r => r.points < prev.config.eliminationThreshold
      );

      if (activeRacers.length <= prev.config.laneCount && activeRacers.length > 0) {
        // Generate final race
        const finalRace = generateFinalRace(prev);
        return {
          ...prev,
          final: finalRace,
        };
      }

      // Generate regular heat
      const newHeat = generateHeat(prev);
      return {
        ...prev,
        heats: [...prev.heats, newHeat],
        currentHeatNumber: newHeat.heatNumber,
      };
    });
  };

  const completeRace = (raceId: string, results: { [lane: number]: number }) => {
    setState(prev => completeRaceUtil(prev, raceId, results));
  };

  const updateHeat = (heat: Heat) => {
    setState(prev => ({
      ...prev,
      heats: prev.heats.map(h => h.heatNumber === heat.heatNumber ? heat : h),
    }));
  };

  const regenerateCurrentHeat = () => {
    setState(prev => {
      // Remove current heat and generate new one
      const heatsWithoutCurrent = prev.heats.filter(
        h => h.heatNumber !== prev.currentHeatNumber
      );

      // Temporarily set state to generate from
      const tempState = {
        ...prev,
        heats: heatsWithoutCurrent,
        currentHeatNumber: prev.currentHeatNumber - 1,
      };

      const newHeat = generateHeat(tempState);

      return {
        ...prev,
        heats: [...heatsWithoutCurrent, newHeat],
      };
    });
  };

  return (
    <TournamentContext.Provider
      value={{
        state,
        addRacer,
        updateRacer,
        deleteRacer,
        updateConfig,
        resetTournament,
        generateNextHeat,
        completeRace,
        updateHeat,
        regenerateCurrentHeat,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within TournamentProvider');
  }
  return context;
}
