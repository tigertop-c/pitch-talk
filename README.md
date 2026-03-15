# Pitch Talk

## Summary
Pitch Talk is a single-app cricket prediction experience for live and simulated IPL matches. Players join a room, lock in ball-by-ball predictions, track squad standings, and share receipts after the match.

## Stack
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase for multiplayer state and real match data

## Local Development
### Prerequisites
- Node.js 18+
- npm

### Install
```sh
npm install
```

### Run
```sh
npm run dev
```

### Environment
Copy `.env.local.example` to `.env.local`.

- Set `VITE_USE_MOCK_DATA=true` to run against local fixtures in `src/test/fixtures/mockMatches.ts`.
- Set `VITE_ENABLE_PITCH_PAISA_DEV_OVERRIDE=true` to unlock the hidden solo Pitch Paisa dev override in local development.
- Set the Supabase env vars to use real match data and multiplayer services.

## Scripts
- `npm run dev` - start the Vite dev server
- `npm run build` - create a production build
- `npm run lint` - run ESLint
- `npm run test` - run Vitest
- `npx tsc --noEmit` - run a TypeScript typecheck

## Repo Working Rules
- Repo-specific agent instructions live in `AGENTS.md`.
- Architecture, process, security, and release decisions go in `docs/DECISIONS.md`.
- The reusable lean change-management template lives in `docs/CHANGE_MANAGEMENT_PROMPT.md`.
- The current platform strategy and implementation priorities live in `docs/REACT_STRATEGY.md`.

## Product Notes
- Preserve the current Vite/React/Supabase stack unless a human explicitly requests a platform change or the current stack blocks the goal.
- Prefer real match data when configured; use mock mode for local or offline development.
- Do not invent real-world match results or unverifiable product claims.

## Platform Direction
- Web is the primary product surface.
- Near-term cross-platform work means improving the existing mobile web experience, not rewriting the client.
- Reassess native clients only after the core gameplay loop, multiplayer flow, and state transitions are stable in React.
