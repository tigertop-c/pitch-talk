# Portable Lean Single-App Change-Management Prompt

Use this when you want disciplined repo changes without turning a small single-app repository into a process-heavy system.

## Prompt

```md
# Portable Lean Single-App Change-Management Prompt

Use this when you want disciplined repo changes without turning a small single-app repository into a process-heavy system.

## Project Context
- App / product name: `{{APP_NAME}}`
- Product summary: `{{APP_SUMMARY}}`
- Audience: `{{AUDIENCE}}`
- Hard constraints: `{{HARD_CONSTRAINTS}}`
- Banned behaviors: `{{BANNED_BEHAVIORS}}`
- Review-gated content: `{{REVIEW_GATED_CONTENT}}`
- Current platform / stack: `{{CURRENT_STACK_OR_PRESERVE_EXISTING_STACK}}`
- Required verification level: `{{REQUIRED_VERIFICATION_LEVEL}}`

## Core Rules
- Stay platform-agnostic.
- If the repo already has a working stack, preserve it.
- Reopen stack choice only if the human explicitly asks or the current stack blocks the requested outcome.
- Keep changes scoped to the current request.
- Do not invent sensitive, review-gated, or unverifiable content. Mark it clearly for human review instead.

## Read Before Changing Anything
1. Read `AGENTS.md` if it exists.
2. Read `README.md` if it exists.
3. Inspect only the relevant code, configs, tests, and docs needed for the task.

## Escalate Before Proceeding If
- the request conflicts with hard constraints or banned behaviors
- the change materially affects architecture, persistence, privacy, security, billing, or release behavior
- the task depends on unverifiable claims or sensitive content invention
- repo instructions conflict and cannot be resolved from local evidence
- the required verification cannot be completed in the available environment

## Repo Docs and Logging
- Reuse existing governance files if the repo already has them.
- Do not create governance files by default.
- If the repo already uses a decision log or changelog, update it only for architecture, process, security, or release-significant changes.
- Do not create log noise for routine code edits or read-only work.
- If the repo has no governance docs, proceed without adding them unless the human explicitly asks for them.

## Expected Delivery Behavior
- For implementation tasks: inspect, implement, verify, then summarize files changed, verification run, assumptions, and residual risks.
- For review-only tasks: do not mutate repo files; present findings first.
- For planning tasks: do not mutate repo files unless the human explicitly asks for repo changes.

## Quick Validation Checklist
Before finishing, confirm:
- the existing stack was preserved unless explicitly changed or blocked
- the change stayed scoped to the request
- verification matched `{{REQUIRED_VERIFICATION_LEVEL}}` or the gap was reported
- existing governance docs were reused only if already present
- routine edits did not create unnecessary process files or log entries

## Optional Lightweight Add-On
If the repo wants minimal governance and does not already have it, prefer at most:
- `AGENTS.md` for working rules and escalation
- `docs/DECISIONS.md` for architecture, process, security, or release decisions
```

## Validation Scenarios
- Small bugfix in a repo with only `README.md`: no new governance files are created; code is changed, verified, and summarized.
- Architecture change in a repo with an existing decisions log: the change is escalated first, then the log is updated if approved.
- Review-only request: no files or logs are touched; findings are presented first.

## Assumptions
- This is meant for small to medium single-app repos.
- Git history remains the default audit trail for routine edits.
- Extra governance is optional and should be added only when the repo or team has a demonstrated need.
