# DerbyMaster - Technical Specification

## Project Overview

DerbyMaster is a browser-based Pinewood Derby race management system inspired by Derby Day! software. It runs entirely client-side as a static Next.js application with no server backend, using browser storage for data persistence. Multiple browser windows can share the same data to support simultaneous race management and spectator displays.

### Key Principles
- **Simplicity**: Easy to use, minimal learning curve
- **Local-first**: All data stored in browser, no server required
- **Multi-window**: Same URL in multiple windows for manager + spectator views
- **Offline-capable**: Works without internet after initial page load
- **Single tournament**: Handles one derby at a time with reset capability

### Key Design Decisions
- **Heat structure**: Each active racer races exactly once per heat (e.g., 12 racers + 4 lanes = 3 races per heat)
- **Pairing strategy**: Mix high-point and low-point racers to prevent fast cars from racing each other early
- **Final race trigger**: When remaining non-eliminated racers ≤ lane count
- **Result entry**: Click car number → select placement from dropdown (invalid options disabled)
- **Points storage**: Accumulated points stored in Racer model for fast access
- **Multi-window sync**: Sequence number in `tournament-seq` triggers reload of `tournament-data`
- **Manager UI**: Three-tab interface (Configuration | Registration | Execution) - one visible at a time
- **Manual override**: Can add/remove racers from heat AND reassign lanes
- **Car number format**: Display as #1, #2, #3, etc.
- **Empty lanes**: Show as empty in UI when odd number of racers

---

## System Architecture

### Technology Stack
- **Framework**: Next.js 14+ (static export mode)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data Storage**: Browser LocalStorage or IndexedDB
- **Build Output**: Static HTML/CSS/JS bundle
- **Deployment**: Any static hosting (Vercel, Netlify, S3, or local filesystem)

### Storage Architecture
```
Browser Storage (LocalStorage/IndexedDB)
├── Tournament Configuration
│   ├── Lane count (default: 4)
│   ├── Elimination threshold (default: 5 points)
│   └── Race format algorithm selection
├── Racers
│   ├── Car number (auto-generated)
│   ├── Scout name
│   ├── Den/Six/Posse (optional)
│   └── Car weight (optional)
├── Races
│   ├── Heat number
│   ├── Race number
│   ├── Lane assignments
│   └── Results (placement per lane)
└── Current State
    ├── Active heat
    ├── Racer standings (points, eliminated status)
    ├── Racer history (heats, lane, points, accumulated points)
    └── Heat queue
```

### Multi-Window Communication
- Multiple browser windows/tabs open to the same URL
- All windows read from shared browser storage
- Changes trigger storage events to update all windows
- Manager window has controls; spectator window is display-only
- No WebSockets or server communication needed

---

## Core Requirements

### 1. Race Format - Ladderless Elimination

**Scoring System**:
- 1st place = 0 points
- 2nd place = 1 point
- 3rd place = 2 points
- 4th place = 3 points (for 4+ lane tracks)
- Nth place = (N-1) points

**Elimination Rules**:
- Racers accumulate points across all heats (stored in Racer.points)
- When a racer reaches the elimination threshold (default: 5 points), they are eliminated
- Elimination threshold is configurable at any time
- Elimination continues until 4 or fewer non-eliminated racers remain (for 4-lane track)
- When remaining racers ≤ lane count, a final race is generated with all remaining racers
- Final race determines final placement (1st, 2nd, 3rd, etc.)

**Algorithm Design**:
- Race format algorithm should be modular/swappable
- Heat participation is a pure function of current standings and race history
- Future support for other formats (round-robin, pools + elimination tournament) post-MVP

### 2. Tournament Configuration

**Track Settings**:
- Lane count: Configurable (default: 4 lanes)
- All lanes used in each race where possible
- System handles odd numbers of racers by having some lanes empty

**Tournament Settings**:
- Elimination threshold: Adjustable (default: 5 points)
- Race format selection (MVP: ladderless elimination only)
- Single division only (no multi-division support)

**Reset Functionality**:
- Clear all tournament data to start fresh
- Confirmation dialog to prevent accidental data loss

### 3. Racer Registration

**Required Information**:
- Scout name (required)

**Optional Information**:
- Den/Six/Posse assignment
- Car weight (unitless)

**Car Numbers**:
- Auto-generated sequentially (1, 2, 3, etc.)
- Displayed prominently for physical label printing
- Cannot be manually changed

**Workflow**:
- No pre-registration (race day only)
- No separate check-in process
- No inspection/weigh-in tracking
- Racers can be added at any time, even mid-tournament

### 4. Heat Generation

**Heat Structure**:
- Each heat consists of multiple races
- Each active (non-eliminated) car races exactly once per heat
- Example: 12 racers, 4-lane track → Heat 1 has 3 races
- Next heat generated after all current heat races complete

**Pairing Algorithm**:
- **Primary goal**: Mix high-point and low-point racers in each race
  - Prevents faster cars from racing each other too early
  - Points scores should approximate a total order on car speed
  - Fast cars (low points) paired with slower cars (higher points)
- Avoid pairing the same racers together twice until it's inevitable
- Rotates each racer through all lanes equally over time
- Ensures no single racer races alone
- Excludes eliminated racers from new heats
- Handles odd numbers of racers gracefully (some lanes empty in final race of heat)

**Manual Override**:
- Allow manual adjustment of generated heats before races begin
- Can add/remove racers from the heat
- Can reassign racers to different lanes within races
- UI provides drag-and-drop or selection interface
- Option to "regenerate" heat to discard manual changes and use algorithm

### 5. Race Execution

**Result Entry**:
- Point-and-click interface (minimal typing)
- **Interaction flow**:
  1. Click on a car number in the race
  2. Select placement from menu (1st, 2nd, 3rd, 4th)
  3. Invalid options disabled (can't assign same placement twice)
  4. Repeat for all cars in the race
- Visual feedback for entered results
- Ability to edit/correct results before finalizing race
- Results automatically update standings when race is finalized

**Standings Calculation**:
- Real-time point accumulation
- Automatic elimination detection
- Maintains complete race history for each racer

**Completion Detection**:
- Tournament ends when final race (between remaining non-eliminated racers) is complete
- Final standings determined by:
  - Top N (lane count) places: Based on final race results
  - Remaining places: Based on elimination order and accumulated points

### 6. Display Views

**Race Manager View**:
- Tabbed interface with three tabs (one panel visible at a time):
  1. **Configuration Tab**
     - Lane count selector
     - Elimination threshold input
     - Reset tournament button (with confirmation)
  2. **Registration Tab**
     - Add racer form (name, den/six/posse, weight)
     - Racer list with car numbers
     - Edit/delete racer (only if no races run)
  3. **Execution Tab**
     - Current heat display with lane assignments
     - Manual heat override controls (add/remove racers, reassign lanes)
     - Result entry controls for current race
     - "Complete Race" and "Generate Next Heat" buttons
     - Standings table with points and elimination status

**Spectator Display View**:
- Current heat information (heat #, race #)
- Large, clear display of racing cars (names, car numbers, lanes)
- Real-time standings table (all racers, points, eliminated status)
- Eliminated racers clearly marked (greyed out, strikethrough, or separate section)
- Final results screen when tournament complete
- Expandable car heat history (all heats, lanes, opponents, results per racer)
- Auto-updates via storage events (no manual refresh)
- Minimal UI chrome, designed for projection
- Landscape orientation

**View Switching**:
- No forced workflow or modals
- All views live and accessible at all times
- Toggle between manager and spectator views in same window
- Or open multiple windows: one for management, one(s) for spectator display

### 7. Data Display (No Printed Reports)

**On-Screen Only**:
- No PDF/printed heat reports
- No printed standings reports
- No printed car history reports
- All information displayed on-screen in appropriate views

**Required On-Screen Data**:
- Current heat lineup (manager view)
- Live standings (both views)
- Car heat history (spectator view, expandable/collapsible)
- Final placements: 1st, 2nd, 3rd (spectator view)

---

## Data Models

### Tournament Configuration
```typescript
interface TournamentConfig {
  laneCount: number;           // Default: 4
  eliminationThreshold: number; // Default: 5
  raceFormat: 'ladderless';     // Future: 'round-robin', 'timed'
  createdAt: Date;
}
```

### Racer
```typescript
interface Racer {
  id: string;                   // UUID
  carNumber: number;            // Auto-generated, sequential
  name: string;                 // Scout name
  denSixPosse?: string;         // Optional
  weight?: number;              // Optional
  points: number;               // Accumulated points (elimination status in inferred)
}
```

### Race
```typescript
interface Race {
  id: string;                   // UUID
  heatNumber: number;           // Which round of heats this belongs to
  raceNumber: number;           // Global race number
  laneAssignments: {            // Lane number → racer ID
    [lane: number]: string | null;
  };
  results?: {                   // Lane number → placement (1st, 2nd, etc.)
    [lane: number]: number;
  };
  completedAt?: Date;
}
```

### Heat
```typescript
interface Heat {
  heatNumber: number;
  races: Race[];
  isComplete: boolean;
  generatedAt: Date;
}
```

### Tournament State
```typescript
interface TournamentState {
  config: TournamentConfig;
  racers: Racer[];
  heats: Heat[];
  final: Race | null;
  currentHeatNumber: number;
  currentRaceNumber: number;
  isComplete: boolean;
  finalStandings?: string[];    // Racer IDs in placement order
}
```

---

## Heat Generation Algorithm

### Algorithm Requirements
- **Input**: Current racer standings, race history
- **Output**: Array of races for next heat (one race per racer, divided into groups of lane-count)
- **Constraints**:
  - **Mix high and low point racers** - Pair fast cars (low points) with slower cars (higher points)
  - Goal: Points scores approximate total order on car speed
  - Distribute lane assignments fairly (rotate through lanes)
  - Avoid repeat pairings (same racers together) until inevitable
  - Exclude eliminated racers
  - Handle odd numbers gracefully (empty lanes in final race of heat)
  - Each active racer appears in exactly one race per heat

### Example Algorithm Approach
1. Get all active (non-eliminated) racers
2. Sort racers by accumulated points (ascending)
3. For each race in the heat:
   - Select racers using a "snake" pattern to mix points:
     - Take one low-point racer, one high-point racer, alternate
   - Assign lanes to balance lane usage across tournament
4. Verify no racer appears twice in the heat
5. Return array of Race objects

### Manual Override
- Generated heat can be edited before races begin
- UI allows change of racers and reassignment of racers to lanes
- Option to "regenerate" heat to discard manual changes

---

## User Interface Components

### Spectator View Components
1. **Current Race Display**
   - Large, prominent heat/race numbers
   - Racing cars with names and numbers
   - Optional den/six/posse names (minimal)

2. **Live Standings Board**
   - Sorted by points
   - Visual indication of eliminated status
   - Top 3 highlighted when tournament complete

3. **Car History Panel**
   - Below current race and live standings - scroll to see it if needed
   - Rows sorted by racer number. 
   - Shows racer history in columns for each race.

### Shared Components
- **View Toggle**: Switch between manager and spectator views
- **Status Indicator**: Tournament state (setup, racing, complete)
- **Auto-Update Indicator**: Visual cue when data changes

---

## Browser Storage Strategy

### Storage Technology Choice
**Option 1: LocalStorage** (Simpler) YES
- Store JSON-serialized tournament state
- Max ~5-10MB (sufficient for hundreds of racers)
- Synchronous API, easy to use
- Triggers `storage` events for multi-window updates

**Option 2: IndexedDB** (More robust)
- Structured storage with indexing
- Larger capacity
- Asynchronous API
- Better for complex queries

**Recommendation**: Start with LocalStorage for MVP, migrate to IndexedDB if needed.

### Multi-Window Synchronization

**Implementation**:
- Store tournament data in `tournament-data` key (full TournamentState as JSON)
- Store sequence number in `tournament-seq` key (incrementing integer)
- On any data update:
  1. Increment sequence number
  2. Save both `tournament-seq` and `tournament-data`
- All windows listen for storage events on `tournament-seq`
- When sequence changes, reload full state from `tournament-data`

**Note**: While `tournament-data` could be split into separate keys by data type, the entire state will be reloaded on any change for simplicity.

### Data Versioning
- N/A for MVP

---

## Future Enhancements (Post-MVP)

### Algorithm Enhancements
- Round-robin race format
- Pool + tournament race format

---

## Design Principles

### Visual Design
- **Clean and minimal**: Focus on essential information
- **High contrast**: Readable from distance on projected displays
- **Large typography**: Car numbers and names easily visible
- **Color coding**: Use color to indicate status (eliminated, racing, waiting)
- **Responsive animations**: Smooth transitions for state changes

### Interaction Design
- **Minimal clicks**: Common actions in 1-2 clicks
- **Forgiving**: Easy to undo/correct mistakes
- **Fast**: No loading states, instant feedback
- **Clear state**: Always obvious what's happening and what to do next

### Accessibility
- N/A for MVP

---

## Testing Strategy

### Unit Tests
- Heat generation algorithm
- Standings calculation
- Elimination detection
- Lane rotation fairness

### Integration Tests
- LocalStorage persistence and queries

### Browser Compatibility
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## Design Decisions Reference

All key questions have been resolved and incorporated into the specification above:

1. **Car number display format**: #1, #2, #3 (with # prefix)
2. **Den/Six/Posse display**: Show minimally in spectator view (small text near car name)
3. **Tie-breaker race**: Automatically generated when needed (for 2nd/3rd place ties)
4. **Empty lanes visual**: Display as empty/blank lane in UI
5. **Heat transition**: Manual "Generate Next Heat" button (not automatic)
6. **Data export**: Not included in MVP

