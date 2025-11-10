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
  addRacer: (name: string, team?: string, weight?: number) => void;
  updateRacer: (racerId: string, updates: { name?: string; team?: string; weight?: number; withdrawn?: boolean }) => void;
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

  const addRacer = (name: string, team?: string, weight?: number) => {
    console.log("Tournament Adding racer: ", name, " (", team, ", ", weight,)
    setState(prev => {
      const newState = addRacerUtil(prev, name, team, weight);
      saveTournamentState(newState);
      return newState;
    });
  };

  const updateRacer = (racerId: string, updates: { name?: string; team?: string; weight?: number; withdrawn?: boolean }) => {
    setState(prev => {
      const newState = updateRacerUtil(prev, racerId, updates);
      saveTournamentState(newState);
      return newState;
    });
  };

  const deleteRacer = (racerId: string) => {
    setState(prev => {
      const newState = deleteRacerUtil(prev, racerId);
      saveTournamentState(newState);
      return newState;
    });
  };

  const updateConfig = (updates: { laneCount?: number; eliminationThreshold?: number }) => {
    setState(prev => {
      const newState = updateConfigUtil(prev, updates);
      saveTournamentState(newState);
      return newState;
    });
  };

  const resetTournament = () => {
    clearTournamentState();
    const newState = createInitialState();
    saveTournamentState(newState);
    setState(newState);
  };

  const generateNextHeat = () => {
    setState(prev => {
      // Check if we should generate final race
      const activeRacers = prev.racers.filter(
        r => r.points < prev.config.eliminationThreshold
      );

      let newState: TournamentState;
      if (activeRacers.length <= prev.config.laneCount && activeRacers.length > 0) {
        // Generate final race
        const finalRace = generateFinalRace(prev);
        newState = {
          ...prev,
          final: finalRace,
        };
      } else {
        // Generate regular heat
        const newHeat = generateHeat(prev);
        newState = {
          ...prev,
          heats: [...prev.heats, newHeat],
          currentHeatNumber: newHeat.heatNumber,
        };
      }

      saveTournamentState(newState);
      return newState;
    });
  };

  const completeRace = (raceId: string, results: { [lane: number]: number }) => {
    setState(prev => {
      const newState = completeRaceUtil(prev, raceId, results);
      saveTournamentState(newState);
      return newState;
    });
  };

  const updateHeat = (heat: Heat) => {
    setState(prev => {
      const newState = {
        ...prev,
        heats: prev.heats.map(h => h.heatNumber === heat.heatNumber ? heat : h),
      };
      saveTournamentState(newState);
      return newState;
    });
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

      const newState = {
        ...prev,
        heats: [...heatsWithoutCurrent, newHeat],
      };

      saveTournamentState(newState);
      return newState;
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
