# Sunnie UI overhaul progress

Last updated: 2026-09-14

This document tracks the staged implementation of the supplied Sunnie UI
overhaul specification. The non-negotiable product and privacy rules in
`AGENTS.md` continue to apply.

## Phase 0 baseline

- Branch: `main`
- Commit: `3f6c8c46023e84fcf2f809ed366ff3a6f6aab3b7`
- Worktree at audit start: clean
- Production baseline: authenticated desktop (1440 x 1000) and mobile
  (390 x 844) captures for Plan, Calendar, Tasks, Focus, Friends, and Settings
  are stored under ignored `local/ui-overhaul-baseline/`.
- The twelve production routes returned HTTP 200 and none showed horizontal
  document overflow at the tested widths.
- Warm route timings from the capture pass were roughly 1.9-2.2 seconds for
  most pages, 3.6 seconds for Calendar (including an intentional longer settle
  delay), and 4.9 seconds for the first Plan navigation. These are diagnostic
  wall-clock samples, not field Core Web Vitals.
- Settings emitted two 403 resource errors for the non-admin test user while
  admin-only status requests resolved. Other captured routes had no page or
  console errors.
- Production build baseline: Calendar is 104 kB route JS / 340 kB first load,
  Tasks is 62.7 kB / 310 kB, Plan is 10.1 kB / 256 kB, Settings is 30.7 kB /
  266 kB, and shared first-load JS is 102 kB.

### Baseline verification

- `npm.cmd run lint`: pass, no warnings
- `npm.cmd run type-check`: pass
- `npm.cmd run test:unit -- --runInBand`: pass, 83 suites and 452 tests;
  one suite/test remains intentionally skipped
- `npm.cmd run build`: pass
- The known Windows standalone trace warning for the task-sync route remains
  present and does not fail the build.

## Audit findings

### Theme and first paint

`src/app/layout.tsx` emits no saved Sunnie color/style attributes or variables.
`ThemeProvider` applies them in a client effect, while the authenticated layout
loads a user-keyed color-theme cache and server settings in another client
effect. `calendarStyle` is not included in that pre-hydration cache. A saved
seasonal theme can therefore paint Base first and Calendar style can paint
Classic before hydration.

### Calendar event loading

`src/app/(common)/calendar/page.tsx` loads every `CalendarEvent` owned through
the user's feeds and sends the full collection to the client. `/api/events`
also returns all owned events with no range parameters, and calendar refreshes
reuse that full read. The database has separate `[feedId]` and `[start, end]`
indexes, but the visible-range query and its real query plan must be measured
before deciding whether a compound index is useful.

### Task mutations

The task store patches local collections after successful writes, not before
them. The Tasks page then refetches Tasks and Projects after create, edit,
delete, status, and several inline operations. Bulk project assignment also
refetches the task collection. This is safe but makes routine edits feel slower
and produces more collection traffic than necessary.

### Loading states

Primary page gaps still use centered spinners on Plan, Tasks, and Friends.
Settings has text-only dynamic loading in one branch. Tune-up and several admin
settings panels also use centered spinners. Narrow control actions appropriately
use inline spinners and do not need blanket replacement.

### Visual color debt

The requested audit pattern currently finds 664 occurrences. The largest
concentrations are `globals.css` (93), `FocusSession.tsx` (68), Plan (64),
Onboarding (51), the landing page (46), Weekly Review and Daily Rhythm (45
each), Task Capture (30), and Friends (23). Some matches are legitimate status
colors, color math, previews, or token fallbacks; presentation colors should be
migrated deliberately rather than mechanically.

### Icon families

Visible application code contains 48 Lucide import sites and 28 React Icons
import sites. No active Heroicons imports were found in the audited app and
component paths. New work will use Lucide, with existing React Icons migrated
when each owning surface is refactored.

### Existing strengths to preserve

- Five complete 44-color registries and stable palette-slot semantics already
  exist.
- Classic/Bujo is independently persisted and compiled into generic DOM
  attributes.
- Theme Lab exercises generic pattern, item, border, and type primitives.
- Calendar color-only edits and feed colors already use targeted optimistic
  behavior.
- Current desktop and mobile shells are structurally responsive at the tested
  widths.

## Exact Phase 1 change surface

The foundation phase will initially touch these files:

- `src/app/layout.tsx` and `src/app/(common)/layout.tsx` for deliberate fonts
  and first-paint display preferences
- `src/components/providers/ThemeProvider.tsx` and
  `src/store/settings.ts` to separate hydration from persisted preference
  updates and keep the first-paint cache current
- `src/lib/color-themes.ts` and `src/lib/planner-themes.ts` only where required
  to serialize generic first-paint variables/attributes and parameterized
  patterns; the 44-color contract will not change
- `src/components/ui/sunnie.tsx` for semantic page, panel, paper, toolbar,
  chip, segmented-control, empty-state, and skeleton primitives
- `src/styles/tokens.css`, `src/styles/surfaces.css`, and
  `src/styles/motion.css`, imported by `src/app/globals.css`, to begin the
  incremental CSS split
- `src/components/navigation/AppNav.tsx`, shared dialogs/forms, and core page
  loading branches as the first consumers
- focused tests under `src/__tests__` and `src/lib/__tests__`

No schema or provider behavior belongs in this foundation slice. Range-scoped
Calendar loading remains a separate performance change so it can be reviewed
and tested independently.

## Sequencing decisions

- Real sticker placement and Mood Garden will not be implemented before the
  foundation, shell, loading, and Calendar range work pass their checks.
- Final sticker artwork must be original or properly licensed. Concept emoji
  previews are not production assets.
- The overhaul will not re-enable the currently disabled onboarding tour or
  change its required/skippable semantics as a side effect of visual work.

## Implementation outcome

### Foundations and shared shell

- Nunito Sans and Kalam are loaded through `next/font`; the application shell,
  forms, dialogs, navigation, and core pages use the shared Sunnie semantic
  surface primitives and split token/surface/motion stylesheets.
- Colorway, Classic/Bujo style, and full/reduced/off motion are cached per user
  and applied before React hydration. Server hydration no longer writes the
  same settings back, and non-admin Settings avoids admin-only status probes.
- Geometry-preserving skeletons cover the core loading states. Routine task and
  friend-visibility mutations update immediately, roll back on failure, and
  protect newer changes from late request responses.
- Active product navigation and controls use Lucide icons, apart from the
  intentionally recognizable Google and Microsoft provider marks.

### Calendar, themes, and assets

- Calendar event requests require a bounded visible range, add a seven-day UI
  buffer, retain recurring masters, cache completed ranges, and deduplicate
  rows. Requests longer than 400 days are rejected. Plan's event context is
  bounded as well.
- Every selectable colorway now has visibly distinct page and stationery art
  direction, parameterized paper patterns, a typed asset manifest, and original
  SVG sticker artwork. Theme Lab exposes the same real asset metadata.
- Bujo Month has an owner-scoped, persistent Sticker Book. Stickers place and
  delete optimistically, support undo and rollback, and can be moved, resized,
  rotated, or keyboard-adjusted while editing. Idle stickers ignore pointer
  input so calendar events remain usable. `react-moveable@0.56.0` is loaded only
  with this sticker layer and persists transforms at interaction end.

### Planning and mood

- Daily Rise and Daily Unwind offer optional private mood, energy, and note
  check-ins without changing their completion requirements.
- Owner/date/phase-unique `DailyMoodEntry` rows feed the monthly Mood Garden in
  Review. Its plant visualization uses a distinct mood palette and deliberately
  has no streak or reward mechanic.
- Three checked-in Prisma migrations add motion preference, Calendar stickers,
  and mood entries. Local PostgreSQL reports all 56 migrations applied.

### Responsive and accessibility work

- Plan, Calendar, Tasks, Focus, Friends, and Settings were checked across
  desktop, mobile, and 80%-200% effective zoom widths without document-level
  horizontal overflow.
- Calendar and project controls now have explicit button types and accessible
  names. Theme choices preserve keyboard focus while a save is pending, and
  sticker editing includes labeled alternatives to direct pointer transforms.
- Full, reduced, and off motion modes are expressed through root attributes;
  reduced-motion operating-system preferences remain an additional safeguard.

## Final verification

- `npm.cmd run lint`: pass, no warnings
- `npm.cmd run type-check`: pass
- `npm.cmd run test:unit -- --runInBand`: pass, 94 suites and 482 tests; the
  existing one-suite/one-test skip remains intentional
- `npx.cmd prisma validate` and `npx.cmd prisma migrate status`: pass; local
  schema is current
- `npm.cmd run build`: pass. Shared first-load JS remains 102 kB. Calendar is
  109 kB route JS / 349 kB first load versus 104/340 kB at baseline; Tasks is
  62.5/307 kB, Plan 17/260 kB, and Settings 31.2/270 kB. Calendar's first-load
  increase is about 2.6%, below the 10% guardrail. The known non-fatal Windows
  task-sync trace-copy warning remains.
- Browser matrix: pass for five themes across Classic/Bujo Calendar Month/Week;
  three themes across Plan, Tasks, Focus, Friends, and Settings; desktop/mobile;
  zoom breakpoints; reduced motion; keyboard theme selection; asset isolation;
  accessible button names; overflow; and settled runtime errors.
- Sticker browser lifecycle: pass for place, reload persistence, idle event
  pass-through, direct Moveable drag, accessible resize/rotate, persisted
  transforms, keyboard delete, desktop, and mobile.
- Mood browser lifecycle: pass for actual Rise/Unwind persistence, monthly
  garden rendering, desktop/mobile layout, and overflow.
- Existing Daily Rhythm Playwright coverage: pass, 2/2 Chromium tests.
- Calendar scale fixture: 10,012 stored events produced 12 visible-range rows;
  the measured PostgreSQL query executed in 1.678 ms and the browser/dev API
  round trip took 341.6 ms. No speculative index was added.
- `npm audit --omit=dev` reports 34 production advisories (3 low, 9 moderate,
  16 high, 6 critical) in broader inherited dependencies. None was introduced
  by React Moveable; upgrades are kept as a separate maintenance task because
  several fixes require breaking dependency changes.

## Phase status

- [x] Phase 0 - baseline and repository audit
- [x] Phase 1 - foundations
- [x] Phase 2 - shared shell
- [x] Phase 3 - Plan
- [x] Phase 4 - Calendar and range loading
- [x] Phase 5 - Tasks
- [x] Phase 6 - Focus, Friends, and Settings
- [x] Phase 7 - complete theme-pack differentiation and asset manifests
- [x] Phase 8 - Bujo sticker/washi V1
- [x] Phase 9 - ritual mood check-ins and Mood Garden
- [x] Phase 10 - full visual, accessibility, performance, and regression QA
