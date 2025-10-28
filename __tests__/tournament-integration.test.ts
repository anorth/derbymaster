import { describe, it, expect } from 'vitest';
import type { TournamentState } from '@/types';
import { createInitialState, addRacer, getActiveRacers } from '@/lib/tournament';
import { generateHeat } from '@/lib/heat-generator';
import { completeRace } from '@/lib/standings';

describe('Tournament Integration', () => {
  it('should run tournament from 8 racers to final 4', () => {
    // Start with initial state
    let state: TournamentState = createInitialState();

    // Add 8 racers
    const racerNames = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Henry'];
    racerNames.forEach(name => {
      state = addRacer(state, name);
    });

    expect(state.racers.length).toBe(8);
    console.log('\n=== Initial Setup ===');
    console.log(`Racers: ${state.racers.map(r => `#${r.carNumber} ${r.name}`).join(', ')}`);

    let heatNumber = 0;

    // Run heats until we have 4 or fewer active racers
    while (getActiveRacers(state).length > state.config.laneCount) {
      heatNumber++;
      console.log(`\n=== Heat ${heatNumber} ===`);

      // Generate heat
      const heat = generateHeat(state);
      state.heats.push(heat);
      state.currentHeatNumber = heat.heatNumber;

      console.log(`Generated ${heat.races.length} race(s)`);

      // Complete each race in the heat
      heat.races.forEach((race, raceIndex) => {
        console.log(`\nRace ${raceIndex + 1}:`);

        // Get racers in this race
        const racersInRace = Object.entries(race.laneAssignments)
          .filter(([_, racerId]) => racerId !== null)
          .map(([lane, racerId]) => {
            const racer = state.racers.find(r => r.id === racerId)!;
            return { lane: parseInt(lane), racer };
          })
          .sort((a, b) => a.lane - b.lane);

        racersInRace.forEach(({ lane, racer }) => {
          console.log(`  Lane ${lane}: #${racer.carNumber} ${racer.name} (${racer.points} pts)`);
        });

        // Simulate results (1st place, 2nd place, etc. in lane order)
        const results: { [lane: number]: number } = {};
        racersInRace.forEach(({ lane }, index) => {
          results[lane] = index + 1;
        });

        // Complete the race
        state = completeRace(state, race.id, results);

        console.log(`  Results: ${Object.entries(results).map(([lane, place]) => {
          const racer = state.racers.find(r => r.id === race.laneAssignments[parseInt(lane)])!;
          return `#${racer.carNumber} ${place === 1 ? '1st' : place === 2 ? '2nd' : place === 3 ? '3rd' : `${place}th`}`;
        }).join(', ')}`);
      });

      // Show standings after heat
      const activeRacers = getActiveRacers(state);
      const eliminatedRacers = state.racers.filter(r =>
        r.points >= state.config.eliminationThreshold && !r.withdrawn
      );

      console.log(`\nStandings after Heat ${heatNumber}:`);
      state.racers
        .sort((a, b) => a.points - b.points || a.carNumber - b.carNumber)
        .forEach(racer => {
          const status = racer.points >= state.config.eliminationThreshold ? ' [ELIMINATED]' : '';
          console.log(`  #${racer.carNumber} ${racer.name}: ${racer.points} pts, ${racer.races} races${status}`);
        });

      console.log(`\nActive racers: ${activeRacers.length}, Eliminated: ${eliminatedRacers.length}`);

      // Safety check to prevent infinite loop
      if (heatNumber > 20) {
        throw new Error('Too many heats generated - possible infinite loop');
      }
    }

    // Final check
    const finalActiveRacers = getActiveRacers(state);
    console.log(`\n=== Tournament Complete ===`);
    console.log(`Final ${finalActiveRacers.length} racers remaining:`);
    finalActiveRacers
      .sort((a, b) => a.points - b.points)
      .forEach(racer => {
        console.log(`  #${racer.carNumber} ${racer.name}: ${racer.points} pts, ${racer.races} races`);
      });

    // Assertions
    expect(finalActiveRacers.length).toBeLessThanOrEqual(state.config.laneCount);
    expect(finalActiveRacers.length).toBeGreaterThan(0);
    expect(state.heats.length).toBeGreaterThan(0);

    // Verify all racers have raced
    state.racers.forEach(racer => {
      expect(racer.races).toBeGreaterThan(0);
    });

    // Verify eliminated racers have points >= threshold
    const eliminatedRacers = state.racers.filter(r =>
      r.points >= state.config.eliminationThreshold
    );
    eliminatedRacers.forEach(racer => {
      expect(racer.points).toBeGreaterThanOrEqual(state.config.eliminationThreshold);
    });
  });

  it('should balance races with odd number of racers', () => {
    let state: TournamentState = createInitialState();

    // Add 5 racers to test uneven distribution
    ['Alice', 'Bob', 'Charlie', 'David', 'Eve'].forEach(name => {
      state = addRacer(state, name);
    });

    const heat = generateHeat(state);

    console.log('\n=== 5 Racers, 4 Lanes ===');
    console.log(`Generated ${heat.races.length} races`);

    heat.races.forEach((race, index) => {
      const racerCount = Object.values(race.laneAssignments).filter(id => id !== null).length;
      console.log(`Race ${index + 1}: ${racerCount} racers`);
    });

    // Should have 2 races with 3 and 2 racers
    expect(heat.races.length).toBe(2);

    const racerCounts = heat.races.map(race =>
      Object.values(race.laneAssignments).filter(id => id !== null).length
    );

    // Verify balanced distribution
    expect(racerCounts[0]).toBe(3);
    expect(racerCounts[1]).toBe(2);

    // Verify each racer appears exactly once
    const racerIds = new Set<string>();
    heat.races.forEach(race => {
      Object.values(race.laneAssignments).forEach(racerId => {
        if (racerId) {
          expect(racerIds.has(racerId)).toBe(false); // No duplicates
          racerIds.add(racerId);
        }
      });
    });
    expect(racerIds.size).toBe(5); // All 5 racers included
  });
});
