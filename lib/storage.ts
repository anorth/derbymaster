import type { TournamentState } from '@/types';

const TOURNAMENT_DATA_KEY = 'tournament-data';
const TOURNAMENT_SEQ_KEY = 'tournament-seq';

// Save tournament state and increment sequence
export function saveTournamentState(state: TournamentState): void {
  if (!isBrowser()) return;

  // Serialize dates properly
  const serializedState = JSON.stringify(state, (key, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  });

  localStorage.setItem(TOURNAMENT_DATA_KEY, serializedState);
  const seq = incrementSequence();
  console.log('Saved tournament state', seq);
}

// Load tournament state
export function loadTournamentState(): TournamentState | null {
  if (!isBrowser()) return null;

  const data = localStorage.getItem(TOURNAMENT_DATA_KEY);
  if (!data) return null;
  console.log('Loaded tournament state');

  try {
    const parsed = JSON.parse(data);
    // Deserialize dates
    if (parsed.config?.createdAt) {
      parsed.config.createdAt = new Date(parsed.config.createdAt);
    }
    if (parsed.heats) {
      parsed.heats = parsed.heats.map((heat: { generatedAt: string; races: { completedAt?: string }[] }) => ({
        ...heat,
        generatedAt: new Date(heat.generatedAt),
        races: heat.races.map((race: { completedAt?: string }) => ({
          ...race,
          completedAt: race.completedAt ? new Date(race.completedAt) : undefined,
        })),
      }));
    }
    if (parsed.final?.completedAt) {
      parsed.final.completedAt = new Date(parsed.final.completedAt);
    }
    return parsed as TournamentState;
  } catch (e) {
    console.error('Failed to parse tournament state:', e);
    return null;
  }
}

// Clear all tournament data
export function clearTournamentState(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(TOURNAMENT_DATA_KEY);
  localStorage.removeItem(TOURNAMENT_SEQ_KEY);
  incrementSequence();
}

// Listen for changes to tournament state across windows
export function onTournamentStateChange(callback: () => void): () => void {
  if (!isBrowser()) return () => {};

  let lastSeq = getSequence();

  const handleStorageEvent = (e: StorageEvent) => {
    // Only respond to changes to the sequence key
    if (e.key === TOURNAMENT_SEQ_KEY) {
      const newSeq = e.newValue ? parseInt(e.newValue, 10) : 0;
      if (newSeq !== lastSeq) {
        lastSeq = newSeq;
        callback();
      }
    }
  };

  window.addEventListener('storage', handleStorageEvent);

  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageEvent);
  };
}

// Type guard to check if we're in browser environment
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

// Get current sequence number
function getSequence(): number {
  if (!isBrowser()) return 0;
  const seq = localStorage.getItem(TOURNAMENT_SEQ_KEY);
  return seq ? parseInt(seq, 10) : 0;
}

// Increment and save sequence number
function incrementSequence(): number {
  if (!isBrowser()) return 0;
  const newSeq = getSequence() + 1;
  localStorage.setItem(TOURNAMENT_SEQ_KEY, newSeq.toString());
  return newSeq;
}
