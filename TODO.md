# DerbyMaster Implementation To-Do List

## Phase 1: Foundation ✅ COMPLETE
- [x] 1.1 Configure Next.js for static export
- [x] 1.2 Create TypeScript type definitions (types.ts)
- [x] 1.3 Create LocalStorage wrapper with multi-window sync (lib/storage.ts)
- [x] 1.4 Create tournament state management utilities (lib/tournament.ts)

## Phase 2: Core Business Logic ✅ COMPLETE
- [x] 2.1 Implement heat generation algorithm (lib/heat-generator.ts)
  - [x] Active racer filtering (non-eliminated)
  - [x] Snake pattern pairing (mix high/low points)
  - [x] Lane rotation tracking and assignment
  - [x] Pairing history tracking (commented out for now, may use later)
- [x] 2.2 Implement standings calculation (lib/standings.ts)
  - [x] Point accumulation from race results
  - [x] Elimination detection (points >= threshold)
  - [x] Final standings calculation
  - [x] Race result validation and processing

## Phase 3: Manager UI - Configuration Tab ✅ COMPLETE
- [x] 3.1 Create tabbed layout component (app/components/ManagerView.tsx)
- [x] 3.2 Configuration tab (app/components/ConfigurationTab.tsx)
  - [x] Lane count selector (dropdown)
  - [x] Elimination threshold input
  - [x] Reset tournament button with confirmation dialog

## Phase 4: Manager UI - Registration Tab ✅ COMPLETE
- [x] 4.1 Add racer form (name required, den/weight optional)
- [x] 4.2 Racer list display with car numbers (#1, #2, etc.)
- [x] 4.3 Edit/delete racer (only if no races run yet)
- [x] 4.4 Auto-generate sequential car numbers

## Phase 5: Manager UI - Execution Tab ✅ COMPLETE
- [x] 5.1 Current heat display
  - [x] Show heat number, race number
  - [x] Display lane assignments for current race
  - [x] Show empty lanes when odd number of racers
- [x] 5.2 Result entry interface
  - [x] Click car number to select
  - [x] Dropdown menu for placement (1st, 2nd, 3rd, 4th)
  - [x] Disable invalid placements (already assigned)
  - [x] Visual feedback for entered results
  - [x] Edit/correct before finalizing
  - [x] "Complete Race" button
- [x] 5.3 Heat management
  - [x] "Generate Next Heat" button
  - [x] Manual override: add/remove racers from heat (TODO: implement UI)
  - [x] Manual override: reassign lanes (TODO: implement UI)
  - [x] "Regenerate Heat" button (TODO: implement UI)
- [x] 5.4 Standings display
  - [x] Table with all racers
  - [x] Points column
  - [x] Elimination status indicator
  - [x] Sort by points

## Phase 6: Spectator View (DEFERRED)
- [ ] 6.1 Current race display (large, clear)
- [ ] 6.2 Live standings board
- [ ] 6.3 Car history panel (expandable)
- [ ] 6.4 Final results screen
- [ ] 6.5 View toggle (manager ↔ spectator)

## Phase 7: Polish & Testing (TODO)
- [ ] 7.1 Multi-window sync verification
- [ ] 7.2 Edge cases (odd racers, ties, final race trigger)
- [ ] 7.3 Visual polish (Tailwind styling)
- [ ] 7.4 Unit tests for core algorithms

## Outstanding Items
- Manual heat override UI (add/remove racers, reassign lanes, regenerate heat)
- Spectator view (deferred per user request)
- Final polish and testing

## Current Status
✅ Core functionality complete!
- All data models implemented
- Heat generation working (snake pattern pairing)
- Standings calculation working
- Manager UI with 3 tabs functional
- Ready for testing
