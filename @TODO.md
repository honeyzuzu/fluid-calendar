# Sunnie work queue

Last reviewed: 2026-09-14.

Use this file for concrete work we have chosen to do. Put rough feature thoughts in [FEATURE_IDEAS.md](FEATURE_IDEAS.md), and consult [AGENTS.md](AGENTS.md) for what already exists.

## Current work

- [x] Selected Sunnie UI overhaul implemented and verified in the current worktree, with the staged evidence recorded in [the overhaul progress log](docs/ui-overhaul-progress.md). It includes deliberate typography and semantic surfaces, reliable preference prepaint, a responsive shell, geometry-preserving loading, range-scoped Calendar reads, optimistic routine edits, five distinct theme worlds, Bujo Month stickers, private ritual mood check-ins and Mood Garden, reduced/off motion choices, and browser regression coverage. This continues the visual-world idea in [FEATURE_IDEAS.md](FEATURE_IDEAS.md).
- [x] Colorway overhaul shipped in `6269b40`. All five colorways apply immediately, theme-linked feeds/events/projects/friends use stable slots that survive provider refreshes, custom colors remain fixed, palette names are visible, the four seasonal interface worlds are distinct, and intention motifs change with the active theme. Broader secondary-screen visual polish remains an optional future pass in [the colorway worksheet](docs/colorways.md).
- [x] Visual-theme engine expanded in the current worktree. The higher-level registry preserves the 44-color contract, Calendar style persists independently as Classic or Bujo, and reusable pattern/surface/border/type/event/task/all-day variants are selected declaratively without theme-ID conditionals. A non-selectable visual test pack verifies the rendering contract, and each selectable theme now has original manifest-backed sticker artwork for the Bujo Month sticker layer. Ambient motion remains intentionally limited to reusable one-shot effects.
- [x] Admin Theme Lab previews built-in colorways and the visual test pack with fake calendar data. Its local controls exercise reusable calendar primitives without altering saved user settings.
- [x] Recurring-event color edits no longer create duplicate occurrences. Equivalent recurrence rules remain on the local cosmetic path, series colors update every related local row, and genuine provider rebuilds clear both master-linked and provider-ID-linked instances first.
- [x] Daily Rise, Daily Unwind, their invitations, and the Plan completion bar now consume theme-level semantic colors. Tasks can choose a theme-linked palette slot or fixed custom color directly, independently of tags, and calendar blocks honor that choice in every view.
- [x] Repository bug-hardening pass completed in this release: protected logging endpoints, owner-scoped task relationships, signed provider OAuth state, reliable settings rollback, restored setup documentation contracts, repaired Google browser-test inputs, and made Bujo paper/outline/sticky-note treatments visibly distinct.

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
