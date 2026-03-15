# React Strategy

## Summary
Pitch Talk stays on the current React/Vite/Supabase stack. Cross-platform reach is a staged product problem, not a rewrite problem.

The immediate goal is to improve reliability and mobile-web quality in the existing app. A native client should only be reconsidered after the core gameplay loop and multiplayer flow are stable.

## Current Direction
- Keep web as the primary product surface.
- Use the existing React app as the source of truth for gameplay and UX decisions.
- Do not add Flutter-specific abstractions, duplicate client architectures, or speculative mobile rewrite scaffolding.

## Implementation Priorities
- Make local and multiplayer game flows deterministic.
- Keep AI players and room behavior consistent in simulated and live modes.
- Reduce state duplication across the page layer, gameplay UI, and multiplayer hook.
- Harden transitions between picker, pregame, game, innings break, and match over.
- Improve mobile-web touch behavior, sticky controls, safe-area spacing, and viewport handling.

## Preferred Refactoring Direction
- Move reusable game/domain logic into hooks or plain TypeScript modules when it is currently coupled to UI rendering.
- Prioritize extraction around:
  - prediction timing
  - ball resolution
  - match progression
  - room/session state
- Keep UI components focused on presentation and interaction wiring.

## Verification Focus
- Quick simulated game start
- Live game start
- Local fallback when room creation fails
- AI players present by default
- Progression across multiple balls, over breaks, innings transitions, and match over
- Multiplayer host and non-host synchronization
- Mobile viewport behavior on narrow screens

## Native Client Trigger
Revisit a native client only when both are true:
- the React app's core gameplay and multiplayer state flow are stable
- product priorities make Android/iOS a primary delivery target rather than a secondary channel
