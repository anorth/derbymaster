import type { TournamentState, Race, Racer } from '@/types';

// Apply race results to update racer points
export function applyRaceResults(state: TournamentState, race: Race): TournamentState {
  if (!race.results) {
    throw new Error('Race has no results to apply');
  }

  // Update racer points and race count based on placements
  // Scoring: 1st = 0, 2nd = 1, 3rd = 2, 4th = 3, etc.
  const updatedRacers = state.racers.map(racer => {
    // Find if this racer was in the race
    const lane = Object.entries(race.laneAssignments).find(
      ([_laneNum, racerId]) => racerId === racer.id
    )?.[0];

    if (!lane) return racer;

    // Get placement for this lane
    const placement = race.results![parseInt(lane)];
    if (placement === undefined) return racer;

    // Add points (placement - 1)
    const pointsToAdd = placement - 1;

    return {
      ...racer,
      points: racer.points + pointsToAdd,
      races: racer.races + 1,
    };
  });

  return {
    ...state,
    racers: updatedRacers,
  };
}

// Complete a race (mark as completed and apply results)
export function completeRace(
  state: TournamentState,
  raceId: string,
  results: { [lane: number]: number }
): TournamentState {
  // Validate results
  const placements = Object.values(results);
  const uniquePlacements = new Set(placements);
  if (placements.length !== uniquePlacements.size) {
    throw new Error('Duplicate placements in results');
  }

  // Find the race and update it
  let updatedState = { ...state };
  let raceFound = false;
  let completedRace: Race | null = null;

  // Check if it's the final race
  if (state.final?.id === raceId) {
    completedRace = {
      ...state.final,
      results,
      completedAt: new Date(),
    };
    updatedState.final = completedRace;
    raceFound = true;
  } else {
    // Search in heats
    updatedState.heats = state.heats.map(heat => {
      const updatedRaces = heat.races.map(race => {
        if (race.id === raceId) {
          raceFound = true;
          completedRace = {
            ...race,
            results,
            completedAt: new Date(),
          };
          return completedRace;
        }
        return race;
      });

      const allRacesComplete = updatedRaces.every(r => r.completedAt);

      return {
        ...heat,
        races: updatedRaces,
        isComplete: allRacesComplete,
      };
    });
  }

  if (!raceFound || !completedRace) {
    throw new Error('Race not found');
  }

  // Apply results to update racer points
  updatedState = applyRaceResults(updatedState, completedRace);

  // Update current race number
  updatedState.currentRaceNumber = completedRace.raceNumber;

  // Check if this was the final race
  if (state.final?.id === raceId) {
    updatedState.isComplete = true;
    updatedState.finalStandings = calculateFinalStandings(updatedState);
  }

  return updatedState;
}

// Calculate final standings when tournament is complete
export function calculateFinalStandings(state: TournamentState): string[] {
  if (!state.final?.results) {
    throw new Error('Cannot calculate final standings without final race results');
  }

  const finalRace = state.final;

  // Get placements from final race (lane -> placement)
  const finalPlacements: { racerId: string; placement: number }[] = [];

  Object.entries(finalRace.laneAssignments).forEach(([lane, racerId]) => {
    if (racerId) {
      const placement = finalRace.results![parseInt(lane)];
      if (placement !== undefined) {
        finalPlacements.push({ racerId, placement });
      }
    }
  });

  // Sort by placement
  finalPlacements.sort((a, b) => a.placement - b.placement);

  // Remaining racers (eliminated) sorted by points (ascending = better)
  const finalistsIds = new Set(finalPlacements.map(fp => fp.racerId));
  const eliminatedRacers = state.racers
    .filter(r => !finalistsIds.has(r.id))
    .sort((a, b) => a.points - b.points);

  // Combine: finalists first, then eliminated
  return [
    ...finalPlacements.map(fp => fp.racerId),
    ...eliminatedRacers.map(r => r.id),
  ];
}

// Get racer standings sorted by points (for display during tournament)
export function getCurrentStandings(state: TournamentState): Racer[] {
  return [...state.racers].sort((a, b) => {
    // Sort by points ascending (lower is better)
    if (a.points !== b.points) {
      return a.points - b.points;
    }
    // Tie-breaker: car number
    return a.carNumber - b.carNumber;
  });
}

// Get racer history (all races they participated in)
export interface RacerHistoryEntry {
  heatNumber: number;
  raceNumber: number;
  lane: number;
  placement?: number;
  pointsEarned?: number;
  opponents: string[]; // Racer IDs
}

export function getRacerHistory(state: TournamentState, racerId: string): RacerHistoryEntry[] {
  const history: RacerHistoryEntry[] = [];

  // Search through all heats
  state.heats.forEach(heat => {
    heat.races.forEach(race => {
      const lane = Object.entries(race.laneAssignments).find(
        ([_laneNum, id]) => id === racerId
      )?.[0];

      if (lane) {
        const laneNum = parseInt(lane);
        const placement = race.results?.[laneNum];
        const opponents = Object.values(race.laneAssignments)
          .filter(id => id && id !== racerId) as string[];

        history.push({
          heatNumber: heat.heatNumber,
          raceNumber: race.raceNumber,
          lane: laneNum,
          placement,
          pointsEarned: placement !== undefined ? placement - 1 : undefined,
          opponents,
        });
      }
    });
  });

  // Include final race if racer participated
  if (state.final) {
    const lane = Object.entries(state.final.laneAssignments).find(
      ([_laneNum, id]) => id === racerId
    )?.[0];

    if (lane) {
      const laneNum = parseInt(lane);
      const placement = state.final.results?.[laneNum];
      const opponents = Object.values(state.final.laneAssignments)
        .filter(id => id && id !== racerId) as string[];

      history.push({
        heatNumber: 0, // Final race
        raceNumber: state.final.raceNumber,
        lane: laneNum,
        placement,
        pointsEarned: placement !== undefined ? placement - 1 : undefined,
        opponents,
      });
    }
  }

  return history;
}
