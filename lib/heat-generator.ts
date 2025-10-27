import type { TournamentState, Heat, Race, Racer, LaneUsage } from '@/types';
import { generateId, getActiveRacers } from '@/lib/tournament';

// Calculate lane usage for each racer across all races
function calculateLaneUsage(state: TournamentState): LaneUsage {
  const usage: LaneUsage = {};

  // Initialize for all racers
  state.racers.forEach(racer => {
    usage[racer.id] = {};
    for (let lane = 1; lane <= state.config.laneCount; lane++) {
      usage[racer.id][lane] = 0;
    }
  });

  // Count lane usage across all heats
  state.heats.forEach(heat => {
    heat.races.forEach(race => {
      Object.entries(race.laneAssignments).forEach(([lane, racerId]) => {
        if (racerId) {
          usage[racerId][parseInt(lane)] = (usage[racerId][parseInt(lane)] || 0) + 1;
        }
      });
    });
  });

  return usage;
}

// Calculate pairing history (who has raced with whom)
// Currently unused but may be useful for future algorithm enhancements
// function calculatePairingHistory(state: TournamentState): PairingHistory {
//   const history: PairingHistory = {};
//
//   // Initialize for all racers
//   state.racers.forEach(racer => {
//     history[racer.id] = new Set<string>();
//   });
//
//   // Track who has raced together
//   state.heats.forEach(heat => {
//     heat.races.forEach(race => {
//       const racersInRace = Object.values(race.laneAssignments).filter(id => id !== null) as string[];
//
//       // Mark each racer as having raced with all others in this race
//       racersInRace.forEach(racerId1 => {
//         racersInRace.forEach(racerId2 => {
//           if (racerId1 !== racerId2) {
//             history[racerId1].add(racerId2);
//           }
//         });
//       });
//     });
//   });
//
//   return history;
// }

// Assign lanes to racers, trying to balance lane usage
function assignLanes(racerIds: string[], laneUsage: LaneUsage, laneCount: number): { [lane: number]: string | null } {
  const assignments: { [lane: number]: string | null } = {};

  // Create array of lanes (1-indexed)
  const availableLanes = Array.from({ length: laneCount }, (_, i) => i + 1);

  racerIds.forEach(racerId => {
    // Find lane this racer has used least
    const laneUsageCounts = availableLanes.map(lane => ({
      lane,
      count: laneUsage[racerId][lane] || 0,
    }));

    // Sort by usage count (ascending) to prefer least-used lanes
    laneUsageCounts.sort((a, b) => a.count - b.count);

    // Assign to least-used available lane
    const assignedLane = laneUsageCounts[0].lane;
    assignments[assignedLane] = racerId;

    // Remove this lane from available lanes
    const laneIndex = availableLanes.indexOf(assignedLane);
    if (laneIndex > -1) {
      availableLanes.splice(laneIndex, 1);
    }

    // Update usage for next iteration
    laneUsage[racerId][assignedLane]++;
  });

  // Fill remaining lanes with null (for odd number of racers)
  availableLanes.forEach(lane => {
    assignments[lane] = null;
  });

  return assignments;
}

// Generate a single heat using snake pattern pairing
export function generateHeat(state: TournamentState): Heat {
  const activeRacers = getActiveRacers(state);

  if (activeRacers.length === 0) {
    throw new Error('No active racers to generate heat');
  }

  const laneCount = state.config.laneCount;
  const nextHeatNumber = state.currentHeatNumber + 1;

  // Sort racers by points (ascending) to mix high and low
  const sortedRacers = [...activeRacers].sort((a, b) => a.points - b.points);

  // Calculate lane usage and pairing history
  const laneUsage = calculateLaneUsage(state);

  // Use round-robin to distribute racers into races
  // For N racers and L lanes: need ceil(N/L) races
  const numRaces = Math.ceil(sortedRacers.length / laneCount);
  const races: Race[] = [];

  // Round-robin distribution: assign racers to races in cycling pattern
  // This ensures balanced races and prevents best racers from racing each other
  const racerAssignments: Racer[][] = Array.from({ length: numRaces }, () => []);

  sortedRacers.forEach((racer, index) => {
    const raceIndex = index % numRaces;
    racerAssignments[raceIndex].push(racer);
  });

  // Create Race objects with lane assignments
  racerAssignments.forEach((racers, index) => {
    const racerIds = racers.map(r => r.id);
    const laneAssignments = assignLanes(racerIds, laneUsage, laneCount);

    races.push({
      id: generateId(),
      heatNumber: nextHeatNumber,
      raceNumber: state.currentRaceNumber + index + 1,
      laneAssignments,
    });
  });

  return {
    heatNumber: nextHeatNumber,
    races,
    isComplete: false,
    generatedAt: new Date(),
  };
}

// Generate final race with all remaining non-eliminated racers
export function generateFinalRace(state: TournamentState): Race {
  const activeRacers = getActiveRacers(state);

  if (activeRacers.length === 0) {
    throw new Error('No active racers for final race');
  }

  if (activeRacers.length > state.config.laneCount) {
    throw new Error('Too many racers for final race');
  }

  const laneUsage = calculateLaneUsage(state);
  const racerIds = activeRacers.map(r => r.id);
  const laneAssignments = assignLanes(racerIds, laneUsage, state.config.laneCount);

  return {
    id: generateId(),
    heatNumber: 0, // Final race is not part of a heat
    raceNumber: state.currentRaceNumber + 1,
    laneAssignments,
  };
}
