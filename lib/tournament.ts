import type { TournamentState, TournamentConfig, Racer, Race } from '@/types';

// Simple UUID generator (browser-compatible)
export function generateId(): string {
  return crypto.randomUUID();
}

// Create initial tournament configuration
export function createInitialConfig(): TournamentConfig {
  return {
    laneCount: 4,
    eliminationThreshold: 6,
    raceFormat: 'ladderless',
    createdAt: new Date(),
  };
}

// Create initial empty tournament state
export function createInitialState(): TournamentState {
  return {
    config: createInitialConfig(),
    racers: [],
    heats: [],
    final: null,
    currentHeatNumber: 0,
    currentRaceNumber: 0,
    isComplete: false,
  };
}

// Add a new racer to the tournament
export function addRacer(
  state: TournamentState,
  name: string,
  team?: string,
  weight?: number
): TournamentState {
  // Calculate next car number (max + 1, or 1 if no racers)
  const carNumber = state.racers.length > 0
    ? Math.max(...state.racers.map(r => r.carNumber)) + 1
    : 1;

  console.log("addRacer, racers", state.racers.length, "next", carNumber)

  const newRacer: Racer = {
    id: generateId(),
    carNumber,
    name,
    team,
    weight,
    points: 0,
    withdrawn: false,
    races: 0,
  };
  console.log("addRacer, newRacer", newRacer)

  return {
    ...state,
    racers: [...state.racers, newRacer],
  };
}

// Update a racer
export function updateRacer(
  state: TournamentState,
  racerId: string,
  updates: Partial<Pick<Racer, 'name' | 'team' | 'weight' | 'withdrawn'>>
): TournamentState {
  return {
    ...state,
    racers: state.racers.map(r =>
      r.id === racerId ? { ...r, ...updates } : r
    ),
  };
}

// Delete a racer (only if no races have been run)
export function deleteRacer(state: TournamentState, racerId: string): TournamentState {
  // Check if any races have been run
  if (state.heats.some(h => h.races.some(r => r.completedAt))) {
    throw new Error('Cannot delete racer after races have been run');
  }

  return {
    ...state,
    racers: state.racers.filter(r => r.id !== racerId),
  };
}

// Update tournament configuration
export function updateConfig(
  state: TournamentState,
  updates: Partial<Pick<TournamentConfig, 'laneCount' | 'eliminationThreshold'>>
): TournamentState {
  return {
    ...state,
    config: {
      ...state.config,
      ...updates,
    },
  };
}

// Check if a racer is eliminated
export function isEliminated(racer: Racer, threshold: number): boolean {
  return racer.points >= threshold;
}

// Get all active (non-eliminated, non-withdrawn) racers
export function getActiveRacers(state: TournamentState): Racer[] {
  return state.racers.filter(r =>
    !isEliminated(r, state.config.eliminationThreshold) && !r.withdrawn
  );
}

// Get racer by ID
export function getRacerById(state: TournamentState, id: string): Racer | undefined {
  return state.racers.find(r => r.id === id);
}

// Get current race (the one being executed)
export function getCurrentRace(state: TournamentState): Race | undefined {
  if (state.currentHeatNumber === 0) return undefined;

  const currentHeat = state.heats.find(h => h.heatNumber === state.currentHeatNumber);
  if (!currentHeat) return undefined;

  // Find first incomplete race in current heat
  return currentHeat.races.find(r => !r.completedAt);
}

// Check if we should trigger final race
export function shouldTriggerFinalRace(state: TournamentState): boolean {
  const activeRacers = getActiveRacers(state);
  return activeRacers.length > 0 && activeRacers.length <= state.config.laneCount;
}
