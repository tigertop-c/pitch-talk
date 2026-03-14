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
