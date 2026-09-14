# Sunnie work queue

Last reviewed: 2026-09-14.

Use this file for concrete work we have chosen to do. Put rough feature thoughts in [FEATURE_IDEAS.md](FEATURE_IDEAS.md), and consult [AGENTS.md](AGENTS.md) for what already exists.

## Current work

- [ ] Complete the colorway overhaul defined in [the colorway worksheet](docs/colorways.md). Sunnie Base and all four seasonal colorways are registered, and the user preference, reduced event/project palettes, `+` custom event-color control, and first calendar-frame polish are implemented. Next, add stable palette-slot persistence for theme-linked items, replace remaining hardcoded Sunnie colors with theme tokens, and finish responsive calendar visual QA.

## Maintenance candidates

These are existing follow-ups, not a prioritized implementation plan or confirmed bugs.

- [ ] Audit and upgrade production dependencies reported by `npm audit --omit=dev`; prioritize Auth.js, Next.js, Axios, and direct dependencies, and do not apply `npm audit fix --force` without testing the breaking upgrades.
- [ ] Audit inherited technical docs and package scripts for upstream SaaS, Infisical, and Docker publishing assumptions before using them for Sunnie.
- [ ] Decide whether to retain Outlook. If removing it, scope a complete pass across authentication, calendars, task providers, settings, schema relations, tests, and docs.
- [ ] Review provider credential encryption and backup handling before expanding beyond the trusted friend/family group.
- [ ] Consider dedicated fake-data previews when making substantial Friends or Settings changes; their release screenshots currently use Plan.

Google OAuth configuration and mobile/constrained-desktop QA remain ongoing setup and verification responsibilities documented in [AGENTS.md](AGENTS.md).

## Adding a selected task

For each task, capture the intended outcome, link its idea if applicable, define the first version and completion criteria, and note relevant verification. Keep the queue small; unfinished ideas can stay in the brain dump.

## Historical lists

The previous lists were inherited from FluidCalendar and mixed completed functionality, old bug reports, and SaaS plans. They are preserved for reference, without treating their checkbox states as current:

- [Original @TODO.md: background jobs](docs/_old/upstream-background-jobs.md)
- [Original TODO.md: upstream backlog](docs/_old/upstream-todo.md)

Reproduce an old bug or check the current code before promoting an archived item into this queue.
