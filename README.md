# DerbyMaster

DerbyMaster is a browser-based Pinewood Derby race management app.
It runs completely in a web browser, sharing tournament state across multiple windows for race control and spectator displays.
All data is stored locally in the browser.

- Use it: https://derbymaster.app

## Highlights
- Offline-capable static build with all data stored in browser LocalStorage
- Configurable ladderless elimination heats, smart pairing, and standings tracking
- Manager interface with configuration, racer registration, and race execution tabs

## Running Locally
```bash
npm install
npm run dev       # start the development server
npm run build     # generate the static export in ./out
npm run lint      # run eslint
npm test          # run vitest
```

## Architecture Notes
- Next.js 16 configured with `output: 'export'`, TypeScript, and Tailwind CSS
- Browser LocalStorage handles persistence and multi-window sync
- Static bundle can be deployed to GitHub Pages or any static host
