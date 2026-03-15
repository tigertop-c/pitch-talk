# Decisions

Use this log only for architecture, process, security, or release-significant decisions. Do not use it for routine file edits.

## Entry Template
- Date: YYYY-MM-DD
- Area: architecture | process | security | release
- Decision:
- Context:
- Consequence:

## 2026-03-13 - Process - Adopt lean repo change management
- Decision: Use a lightweight repo governance model built around `README.md`, `AGENTS.md`, and this decision log.
- Context: The repo previously had no repo-level agent instructions and the README was still generic Lovable scaffolding. The goal was to preserve stack discipline, scoped changes, escalation, and verification without adding mandatory governance scaffolding or per-mutation logging.
- Consequence: Routine edits should rely on git history. Only architecture, process, security, or release-significant changes belong in this file.

## 2026-03-14 - Architecture - Keep Pitch Talk on React as the primary client
- Decision: Keep the current React/Vite/Supabase app as the primary product surface and defer any Flutter or parallel mobile-client rewrite.
- Context: The app already has a working web client with gameplay, multiplayer, and animation-heavy flows. The immediate engineering need is reliability and mobile-web quality, not a full cross-platform rewrite.
- Consequence: Near-term work should focus on deterministic game flow, AI/player consistency, multiplayer resilience, and mobile browser polish in the current stack. Any future native-client evaluation should happen only after the React codebase has a cleaner reusable logic layer.

## 2026-03-14 - Architecture - Use fixed-room shared-pot informal wagers
- Decision: Use one room-wide stake for the full match, keep the same wager amount for every pick, and settle predictions as per-ball shared pots with no rollover.
- Context: Per-ball wager sizing added too much friction for live play and made multiplayer coordination unclear. The product goal is to keep the betting feel social and readable: players agree to a room stake up front, each active pick on a ball contributes the same amount, and only that ball's pool is settled.
- Consequence: The pregame flow now locks one room stake tier for the match (`Chai`, `Martini`, `Patiala`). Live play only asks for the outcome pick. Winners split that ball's pool by weighted share based on pick difficulty, no-win balls expire instead of rolling over, live standings show running net totals, and final pairwise settlement instructions are generated only in the receipt/share flow.
