
This file provides guidance to AI agents when working with code in this repository.

# Project Overview

Derby Master is a web app for running Scout Pinewood Derby tournaments.

# Architecture
- **App Router**: Uses Next.js App Router (app/ directory)
- **TypeScript**: Full TypeScript setup with strict mode enabled
- **Styling**: TailwindCSS v4
- **Imports**: Path alias `@/*` resolves to project root.

## Project-specific tools

- `npm run dev` runs the development server (I'll do this)
- `npm run lint` runs the linter to check for errors, warnings and style issues
- `npm run test` runs the tests (if any)

Don't run 'build' to confirm correctness (it messes with any running dev server). Use 'lint' instead.

# Code style and conventions

- Prefer a top-down approach to code. Files should lead with the main/exported/public function or component, and work down to the details. Put helpers toward the end of the file.
- Extract non-trivial magic numbers and parameters into symbolic CONSTANTS at the top of the file.
- Use unexported pure functions rather than methods for helpers where possible.
- Always use absolute imports, except when they are in the same directory (`./`).

## Frontend
- Uses TypeScript with strict mode
- React components use default exports, but otherwise avoid default exports
- CSS follows TailwindCSS utility-first approach

## Naming
- Use good names, but avoid verbosity or redundancy. E.g. nextProblem() instead of getNextProblem(), sessionComplete() instead of isSessionComplete().

## Comments
- Preserve vertical space, prefer single-line comments
- Prefer // inline comments, including for most function/method and member documentation
- Rarely use /** Block comment */ – only for extensive public API documentation
