# Derby Master

Derby Master is a browser-based Pinewood Derby race management app.
It runs completely in a web browser, sharing tournament state across multiple windows for race control and spectator displays.
All data is stored locally in the browser.

- Use it: https://derbymaster.app

Derby Master was built for Arrowtown Scout Group (NZ) and is perfect for running section- or group-level tournaments.

## Highlights
- Offline-capable static build with all data stored in browser LocalStorage
- Configurable ladderless elimination heats, smart pairing, and standings tracking
- Manager interface with configuration, racer registration, and race execution interface
- One-click entry of race results
- Spectator view with live standings and next race information 

## Running Locally
```bash
npm install
npm run dev       # start the development server
npm run build     # generate the static export in ./out
npm run lint      # run eslint
```

## Architecture Notes
- Next.js 16 configured with `output: 'export'`, TypeScript, and Tailwind CSS
- Browser LocalStorage handles persistence and multi-window sync
- Static bundle can be deployed to GitHub Pages or any static host

## Contributing
Contributions to improve and extend Derby Master are welcome!

Please open an issue first to describe the problem or proposed changes.