# Pitch Talk Agent Rules

## Project Context
- App: `Pitch Talk`
- Summary: Ball-by-ball cricket prediction app for live and simulated IPL matches, with multiplayer rooms, squad banter, leaderboards, and shareable receipts.
- Audience: Cricket fans playing live with friends or testing flows locally.
- Stack: Preserve the existing Vite + React + TypeScript + Tailwind + Supabase stack.
- Review-gated content: Legal/privacy copy, monetization or release claims, and unverifiable marketing claims require human approval.
- Required verification: Run the narrowest relevant check for the change. Prefer `npx tsc --noEmit` for TypeScript/UI changes, `npm run test` for logic covered by tests, and `npm run build` for bundling or integration-sensitive changes. If the environment blocks verification, report the gap.

## Read Order
1. Read this file.
2. Read `README.md`.
3. Inspect only the relevant code, config, tests, and docs for the task.

## Core Rules
- Keep changes scoped to the current request.
- Preserve the existing stack unless the human explicitly asks to change it or the current stack blocks the requested outcome.
- Reuse existing docs and conventions instead of creating parallel process files.
- Do not invent match data, sensitive content, or unverifiable product claims. Mark placeholders clearly when human review is needed.
- For review-only tasks, do not mutate repo files.

## Escalate Before Proceeding If
- the request conflicts with stated constraints or banned behaviors
- the change materially affects architecture, persistence, Supabase schema/data flow, privacy, security, billing, or release behavior
- the task depends on unverifiable claims or sensitive content invention
- local instructions conflict and cannot be resolved from repo evidence
- the required verification cannot be completed in the available environment

## Docs and Logging
- Do not create governance files by default beyond the lightweight files already in this repo.
- Update `docs/DECISIONS.md` only for architecture, process, security, or release-significant changes.
- Do not create log noise for routine edits or read-only work.
