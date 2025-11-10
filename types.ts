// Core data models for DerbyMaster

export interface TournamentConfig {
  laneCount: number;           // Default: 4
  eliminationThreshold: number; // Default: 5
  raceFormat: 'ladderless';     // Future: 'round-robin', 'timed'
  createdAt: Date;
}

export interface Racer {
  id: string;                   // UUID
  carNumber: number;            // Auto-generated, sequential
  name: string;                 // Racer name
  team?: string;                // Optional team name
  weight?: number;              // Optional
  races: number;                // Count of completed races
  points: number;               // Accumulated points (elimination status is inferred)
  withdrawn: boolean;           // Withdrawn from tournament (ineligible for future races)
}

export interface Race {
  id: string;                   // UUID
  heatNumber: number;           // Which round of heats this belongs to
  raceNumber: number;           // Global race number
  isFinalRace: boolean;
  laneAssignments: {            // Lane number → racer ID
    [lane: number]: string | null;
  };
  results?: {                   // Lane number → placement (1st, 2nd, etc.)
    [lane: number]: number;
  };
  completedAt?: Date;
}

export interface Heat {
  heatNumber: number;
  races: Race[];
  isComplete: boolean;
  generatedAt: Date;
}

export interface TournamentState {
  config: TournamentConfig;
  racers: Racer[];
  heats: Heat[];
  final: Race | null;
  currentHeatNumber: number;
  currentRaceNumber: number;
  isComplete: boolean;
}

// Helper type for tracking lane usage by racer
export interface LaneUsage {
  [racerId: string]: {
    [lane: number]: number;     // Count of times racer used this lane
  };
}

// Helper type for tracking pairing history
export interface PairingHistory {
  [racerId: string]: Set<string>; // Set of racer IDs this racer has raced against
}
