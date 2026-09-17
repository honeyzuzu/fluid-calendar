# Sunnie Planner Project State

Last updated: 2026-09-17

## Product Goal

Sunnie Planner is a private, warm, friend-oriented planner inspired by Sunsama and built from the open-source FluidCalendar project. It is intended for the owner, friends, and family rather than as a public commercial SaaS product.

The product should combine:

- Daily and weekly task planning.
- Calendar aggregation and synchronization.
- Automatic time-block scheduling around calendar conflicts.
- Optional calendar visibility sharing between accepted friends.
- A soft, cute Sunnie visual identity using warm yellow, green, cream, peach, and pastel colors.
- A responsive web experience that works on desktop and mobile.

Keep the product approachable. Prefer plain language such as “Schedule day” and “This week” over technical scheduling terminology.

## Repository and Deployment

- Current local checkout: `C:\Users\xiaop\Downloads\fluid-calendar` (paths may differ on other machines; use the active workspace).
- GitHub repository: `https://github.com/honeyzuzu/fluid-calendar`
- Primary branch: `main`
- Upstream source: `https://github.com/dotnetfactory/fluid-calendar`
- Production URL: `https://sunnie-planner-prod.up.railway.app`
- Hosting: Railway
- Database: Railway-managed PostgreSQL
- Application port: `3000`

This checkout currently has only `origin`. The optional `upstream` remote refers to the original project:

```text
origin    https://github.com/honeyzuzu/fluid-calendar.git
upstream  https://github.com/dotnetfactory/fluid-calendar.git
```

Pushing `main` triggers Railway deployment. The owner’s computer and local Docker do not need to remain running for friends to use production. Production data persists in PostgreSQL and is not stored only inside the disposable application container.

After pushing a verified change, do not poll, watch, or wait for Railway deployments or Discord workflow runs. Hand the push off and let those services finish asynchronously unless the user explicitly asks for a specific deployment check.

## Project Notes and Planning

- `README.md` is the entry point for Sunnie setup and the repository map.
- `AGENTS.md` records implemented behavior, architecture, and working rules. Keep it aligned with code when features ship.
- `FEATURE_IDEAS.md` is the owner's informal feature brain dump. Preserve the owner's wording; ideas may be incomplete, unprioritized, or contradictory. An idea is not an instruction to implement it.
- `@TODO.md` is the single current work queue: scoped implementation work and clearly labeled maintenance candidates. `TODO.md` points to it rather than maintaining another list.
- When the owner chooses an idea, discuss the intended experience and open questions, define a small first version and completion criteria, then link a concrete task in `@TODO.md`. Do not invent owner ideas or silently turn the whole brain dump into committed work.
- When work ships, remove it from the active queue or mark it complete with a commit reference, update the linked idea, and record lasting behavior here. Git history holds older completed work.
- `docs/_old/` contains historical upstream notes, including the original TODO lists. Their checked and unchecked items are not verified Sunnie status or an active roadmap. Other inherited technical docs should be checked against code before use.

## Architecture

Sunnie is one full-stack Next.js application, not a separate frontend plus custom backend service.

```text
Browser
  -> Next.js 15 App Router UI
  -> Next.js route handlers under src/app/api
  -> Prisma ORM
  -> PostgreSQL

External integrations
  -> Google OAuth / Google Calendar APIs
  -> CalDAV for Apple Calendar and other compatible providers
  -> Discord incoming webhook through GitHub Actions
```

Primary technologies:

- Next.js 15, React 19, and TypeScript.
- Tailwind CSS and Radix UI.
- FullCalendar for calendar views.
- Zustand for client state.
- Prisma 6 with PostgreSQL.
- NextAuth for sessions and account authentication.
- Google APIs for Google Calendar and Google Tasks.
- `tsdav` and `ical.js` for CalDAV/Apple Calendar.
- Playwright for browser tests and Discord preview screenshots.

Important source locations:

- `src/app/(common)/calendar` and `src/components/calendar`: calendar UI.
- `src/app/(common)/tasks` and `src/components/tasks`: task UI.
- `src/app/(common)/plan/page.tsx`: saved daily/weekly planning screen.
- `src/app/(common)/friends/page.tsx`: friend requests and visibility.
- `src/app/(common)/settings`: user/admin/integration settings.
- `src/app/api`: authenticated backend route handlers.
- `src/services/scheduling`: auto-scheduling engine.
- `src/lib/caldav-*`: CalDAV synchronization and serialization.
- `src/app/preview/plan/page.tsx`: public fake-data screenshot preview.
- `src/lib/color-themes.ts`, `src/lib/planner-themes.ts`, and `docs/colorways.md`: canonical color slots, higher-level visual-theme registry, and owner worksheet.
- `docs/new-theme-template.md`: fill-in contract for proposing a complete 44-color visual theme without writing code.
- `prisma/schema.prisma`: canonical data model.
- `prisma/migrations`: production database migrations.
- `Dockerfile` and `entrypoint.sh`: Railway production build/startup.

## Production Startup and Database Lifecycle

Railway builds the root `Dockerfile` using Node 22 Alpine. The build:

1. Installs dependencies including development dependencies.
2. Rebuilds the native `bcrypt` binding from source.
3. Generates Prisma Client.
4. Runs the Next.js production build.
5. Copies the standalone Next.js server and Prisma tooling into the runtime image.

At container startup, `entrypoint.sh`:

1. Parses the PostgreSQL host and port from `DATABASE_URL`.
2. Waits for PostgreSQL to accept connections.
3. Runs `prisma generate`.
4. Runs `prisma migrate deploy`.
5. Starts `node server.js`.

Always add a checked-in Prisma migration for schema changes. Use `prisma migrate deploy` in production. Do not replace this with `prisma db push`: the `ConnectedAccount` uniqueness behavior relies on a PostgreSQL `NULLS NOT DISTINCT` migration that Prisma’s schema DSL cannot fully express.

The local `docker-compose.yml` still references the upstream published FluidCalendar image for its `app` service. It will not automatically contain Sunnie source changes. For normal local development, start only PostgreSQL and run Next locally:

```powershell
npm.cmd run db:up
npm.cmd run prisma:generate
npm.cmd run dev
```

Local PostgreSQL 16 is isolated in Docker as `sunnie_local` on
`127.0.0.1:5433`. The ignored local `.env` uses that address, while the app
container receives its internal `db:5432` address from Compose and Railway
injects production `DATABASE_URL` independently. `npm.cmd run db:setup` starts
the local database, generates Prisma Client, and applies checked-in migrations.
That setup script forces the local URL for its Prisma commands rather than
trusting a possibly inherited production environment variable.
See `docs/local-postgres.md` for setup and maintenance commands.

## Environment and Secrets

Never commit or print real secret values. Important configuration names include:

- `DATABASE_URL`: PostgreSQL connection string. On Railway this should be a reference to the PostgreSQL service variable.
- `NEXTAUTH_URL`: exact public application origin; production uses the Railway URL.
- `NEXTAUTH_SECRET`: long random session-signing secret.
- `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL`: public application URL where required by existing code.
- `NEXT_PUBLIC_ENABLE_SAAS_FEATURES`: should remain disabled for the private open-source deployment.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: optional environment fallback; credentials may also be configured by an admin in System settings.
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL`: optional password-reset email delivery.

GitHub Actions contains a repository secret named `DISCORD_RELEASE_WEBHOOK`. It belongs in GitHub **Settings -> Secrets and variables -> Actions**, never in Railway variables or source files.

Provider access tokens and CalDAV app-specific passwords are persisted through `ConnectedAccount`. Treat the database and backups as sensitive. Before expanding beyond a trusted private group, review application-level credential encryption and operational backup security.

## Authentication and Friends

- `/setup` creates the initial admin account when the database has not been initialized.
- NextAuth supports credentials sessions and Google sign-in when configured.
- Public signup defaults to off.
- To onboard friends, the admin can temporarily enable public signup under the admin user settings, let friends create accounts, and disable signup again.
- Friend requests are sent to an existing account email.
- Friend relationships must be accepted.
- Sharing defaults to `BUSY_ONLY`; each side controls what the other may see.
- Shared friend calendar/focus blocks are loaded by authenticated `/api/friends/events` requests.
- Authentication middleware rebuilds sign-in and callback URLs from the configured public app origin (`NEXTAUTH_URL`, with `AUTH_URL` as a fallback) so an internal Railway host cannot leak into OAuth redirects.
- Friends setup copy reflects Sunnie's private deployment: admins are sent to the admin user settings to open signup temporarily, while non-admins are told to ask the server owner.
- Do not weaken user ownership filters in API queries. Task, calendar, account, friend, and setting operations must remain scoped to the authenticated user.

## Calendar Integrations

### Google

Google is used for sign-in and Google Calendar sync. Production Google Cloud configuration must include:

```text
Authorized JavaScript origin:
https://sunnie-planner-prod.up.railway.app

Authorized redirect URIs:
https://sunnie-planner-prod.up.railway.app/api/auth/callback/google
https://sunnie-planner-prod.up.railway.app/api/calendar/google
```

The Google Calendar and People APIs must be enabled. Google Tasks is also used by the inherited task-sync functionality. If the OAuth consent screen remains in testing mode, every user must be an approved test user. Publishing broadly may require Google verification depending on scopes and audience.

### Apple Calendar and CalDAV

Apple Calendar uses CalDAV rather than an Apple-specific OAuth API:

- Preset server: `https://caldav.icloud.com`
- Username: Apple Account email.
- Password: an Apple-generated app-specific password, never the normal Apple Account password.

Generic CalDAV connections are also exposed for providers such as Fastmail and Nextcloud. Multiple CalDAV accounts are supported. Calendar sync preserves Sunnie-only per-event color overrides.

### Outlook Caveat

The intended Sunnie UI emphasizes Google, Apple, and generic CalDAV. However, inherited Outlook models, API routes, feed icons, and the System settings credential panel still exist in the repository. Do not claim Outlook has been fully removed. If removing it, audit calendar feeds, task providers, authentication options, Prisma relations, tests, and documentation together rather than deleting isolated UI controls.

## Current User-Facing Features

For safe, reversible edits, optimistic UI is the default Sunnie interaction
rule: update visible local state immediately, persist in the background, and
restore the previous value with a clear message if persistence fails. Do not
hold a modal or popover open merely to wait for a routine color or preference
request. Operations with irreversible effects, provider ambiguity, or required
server validation may still wait for confirmation.

### Sunnie identity and responsive UI

- App name, metadata, favicon, Google OAuth logo, setup page, sign-in page, settings, and primary application surfaces use Sunnie branding.
- Visual language uses warm cream backgrounds, sunny yellow accents, leafy greens, peach, pastel colors, rounded cards, and the Sunnie sun icon.
- Motion is intentionally restrained: task cards gently rise on entry, calendar task blocks lift slightly on hover, focus pets respond subtly, and sun-drop badges use a one-shot pop. `UserSettings.motionPreference` persists `full`, `reduced`, or `off`; the preference is applied before hydration and all custom motion respects it together with the operating system's reduced-motion request.
- Task completion uses a slow 2.8-second sunny bloom and one light pastel confetti shower rather than a rapid repeated burst.
- The former bottom-right “island” control was removed.
- Mobile layouts exist for the main navigation, calendar, tasks, focus, settings, and related screens. The fixed mobile navigation is 5rem tall with larger 20px icons and 11px labels, plus safe-area padding for phones with home indicators.
- Below 1024px, primary app destinations use the fixed mobile icon bar instead of squeezing or dropping the desktop navigation. Between 1024px and 1280px, the top navigation remains compact and icon-only.
- The detailed Tasks table is reserved for windows at least 1800px wide. Smaller desktop widths use a dense two-, three-, or four-column card grid while mobile stays single-column, so cards do not become wastefully wide and users are not forced to discover a hidden horizontal scrollbar.
- Saved colorway, Calendar style, and motion preferences are cached per user and prepainted by the root layout, preventing a Base/Classic/full-motion flash before React hydrates. Server settings hydrate the client store without issuing a preference write, and non-admin Settings screens do not probe admin-only status routes.
- Mobile Settings uses a native section picker while desktop retains the settings card navigation. Personal Settings includes an About section for the application version and the private, friend-oriented product principles; authenticated pages no longer expose a repository-linked version footer. Dialogs expose descriptions, keep one intentional content scroller, and restore focus to the control that opened them.
- Daily summary email is opt-in for new accounts. `NotificationSettings` records the latest consent timestamp and source when the preference is changed; the migration preserves existing users' saved choices while changing the database default to off.
- Core application surfaces use shared semantic page, paper, panel, toolbar, chip, segmented-control, empty-state, and skeleton primitives. Geometry-preserving skeletons replace full-page spinners while initial data loads; the root route fallback renders immediately, and the account area keeps an avatar-shaped placeholder instead of adding loading text to the navigation.
- The upstream support banner has been removed from the calendar.

### First-time onboarding

- The guided onboarding and replay controls are temporarily disabled through `ONBOARDING_TOUR_ENABLED` while the owner redesigns the tutorial. Keep the existing tour implementation and saved onboarding data intact so the refreshed version can be resumed later.
- `UserSettings.onboardingVersion` stores the latest completed welcome-tour version. Version `3` adds Weekly Review to the main tour. Existing accounts receive a short four-step Weekly Review tour; accounts that also missed the version 2 sleep-hours update receive both updates without repeating the full introduction.
- `UserSettings.sleepHoursStart`, `sleepHoursEnd`, and `sleepHoursConfigured` persist the user's normal rest window in PostgreSQL. Bedtime and wake-up are editable under User Settings as well as onboarding. Auto-scheduling filters out every slot that overlaps the configured window, including overnight windows, and authenticated manual task updates reject scheduled times that overlap it.
- When re-enabled, the authenticated common layout opens a required one-time onboarding flow. It first explains Sunnie, embeds the existing Google/Apple/CalDAV account manager, lets the user enable or hide imported calendars, asks for sleep hours, and then shows brief page-level bubbles for Calendar, the unified Tasks workspace, Plan, Friends, and Focus.
- New-user onboarding creates a small user-named practice task on the Tasks step, selects it in Focus, and immediately opens Focus next so the combined setup/focus/break Pomodoro controls are visible during the tour.
- Tour progress survives same-tab OAuth redirects through session storage, while completion is persisted per user in PostgreSQL by `/api/onboarding`.
- Each step contains a short curated quote with its author. The tour has Back/Next controls but no permanent skip; an interrupted user resumes until the current version is completed.
- The hidden replay controls support the app tour and the shorter Weekly Review tour. When restored, replays skip account setup and practice-task creation and do not change the saved onboarding state. Tour routes are prefetched and Next advances immediately without waiting for calendar-status refreshes.

### Tasks and projects

- Tasks support status, title, descriptions, start/due dates, duration, priority, energy, preferred time, tags, projects, recurrence, and external sync metadata.
- Tasks default to `isAutoScheduled = true`; users opt out rather than opt in.
- Manual calendar placement locks a task so later auto-scheduling does not unexpectedly move it.
- Tasks, Brain Dump, and Task Tune-up live under one Tasks destination. The internal My tasks, Brain dump, and Tune-up controls replace the former List/Board switch, and legacy `/brain-dump` visits redirect into the Tasks workspace.
- The Tasks workspace uses one responsive task view instead of a separate status board. Its filters form a compact toolbar on desktop, cards gain columns as space permits, and the detailed table remains available only on very wide screens.
- New-task capture starts with title, weekly pool, and duration. Dates, scheduling controls, project, tags, color, and recurrence stay behind an optional details disclosure; the modal has one intentional scroller, a stable footer, inline save errors, and an optional create-another loop. Editing opens the full form immediately.
- Task cards keep a large leading completion toggle visible, use the title as the edit affordance, reserve dragging for the grip, and place destructive actions in a persistent overflow menu.
- The Focus task queue gives every task a dedicated completion toggle. Completed tasks can be marked incomplete from the same control.
- Focus setup may be 0, 5, or 10 minutes. A running setup can advance immediately with “Ready to start”; during focus, “I finished the task” completes the task while “End focus early” stops the round without completing it. Phase-specific labels replace the ambiguous shared “End early” action.
- Project organization, filtering, sorting, tags, recurrence, and task sync are retained from FluidCalendar.
- Projects use a separate warm pastel palette from calendar events. Their sidebar entries are full-color tiles; project color is organizational identity only and does not recolor the tasks inside the project.
- Project creation validates and trims its input on the server. A failed save leaves the dialog open and shows a retryable error instead of silently failing; successful projects appear immediately at the top of the project list.
- Filled task, event, and project surfaces choose warm white text by default and switch to Sunnie's soft near-black when WCAG contrast would otherwise be poor. The project picker is visible as a horizontal chip row on mobile Tasks screens.
- Calendar event and scheduled-task text is hue-coordinated with its displayed swatch: the color is progressively mixed toward the active theme's cream or ink until it passes WCAG AA normal-text contrast. Outline events use a darkened version of their palette hue against the raised-paper surface; invalid custom colors retain the warm cream/soft-black fallback, with true black reserved for the narrow middle-luminance range where softer choices cannot pass.
- Task cards can be dragged onto a project tile in the desktop sidebar to reassign them, or onto the remove-project drop zone to unassign them. A high-layer preview follows the pointer during the drag, and the touch-safe grip keeps mobile scrolling and task actions from fighting the gesture.
- Routine task updates, deletes, and bulk project assignment update local state optimistically, roll back with a clear message on failure, and use mutation versions so a late failed request cannot overwrite a newer choice. Auto-scheduling after edits is debounced and avoids redundant full task refetches. Background scheduling after routine edits and calendar sync preserves future task blocks unless their duration changed or a selected calendar now conflicts with them; it fills unscheduled and expired tasks around those blocks. Deliberate Schedule day, Schedule week, and Schedule all actions can rebuild their requested placements.
- The desktop Projects panel collapses to a slim arrow rail and reserves layout space whenever opened, including on constrained windows; the mobile project chip list can also be folded with the same side-arrow language.
- Calendar, Projects, and Focus sidebar controls use attached rectangular edge tabs with one seamless flat side instead of detached circular buttons. Calendar and Projects each render one persistent toggle outside the panel transform, preventing doubled controls, clipped click targets, or missing tabs at wide breakpoints; tab and panel surfaces use the same background color. Opening the desktop Projects panel always expands its parent layout width from a slim rail to 256px, including constrained desktop windows, so Tasks content shifts rather than sitting underneath it; the panel itself uses an opaque warm-cream surface.

### Brain Dump and task tune-up

- The Brain dump view inside `/tasks` turns each non-empty line or common list item into a separate auto-schedulable task; repeated lines in the same dump are ignored. `/brain-dump` remains only as a compatibility redirect.
- Brain Dump is deterministic and does not require an AI provider. Users should put one thought on each line; optional AI paragraph interpretation is a possible later enhancement.
- Unsaved brain-dump text is retained only in that browser's local storage. Submitted items become normal database-backed tasks.
- Task Tune-up cycles flashcard-style through every active task that is missing a duration, due date, priority, or energy level, including tasks created elsewhere in Sunnie. Due date uses the native date picker and is required before saving a tune-up card. Each card names its remaining requirements, and changing its weekly pool never clears an entered due date.
- Each tune-up card also exposes task status. Completed tasks are excluded from the tune-up queue.

### Daily and weekly planning

- Plan is divided into Today, Week, and Review views so daily planning, weekly organization, and reflection do not compete in one long screen. Switching views keeps an unsaved Weekly Review draft mounted, and the timezone-aware intention reminder is hidden on Plan itself to avoid repeating the same content.
- Daily Rise is a four-step guided morning ritual built on the existing intention, daily/weekly task selection, estimates, capacity meter, and Schedule day behavior. It calls out yesterday’s unfinished work only when the prior Daily Unwind was not completed, remains manually available, and always offers a friendly “Not now” exit.
- Daily Unwind shows actual tasks completed that day and ended calendar events as separate memory cues. Every unfinished daily task must be marked done, moved to tomorrow or another date, returned to This week, or placed in Backlog before finishing. An optional private day vibe and one short reflection are stored on `DailyPlan`; they are not shared with Friends or sent to AI.
- Daily Rise and Daily Unwind can each save one optional private mood check-in per local date and phase, using the same five-mood scale plus optional energy and a short note. `DailyMoodEntry` is owner-scoped, is never shared with Friends or sent to AI, and feeds the monthly Mood Garden under Plan's Review view. Mood Garden is a reflective plant visualization with no streaks or reward economy; an empty month collapses to a gentle check-in invitation instead of displaying a large blank grid.
- `UserSettings.dailyRiseEnabled`, `dailyRiseTime`, `dailyUnwindEnabled`, `dailyUnwindTime`, and `dailyRitualDays` configure timezone-aware in-app invitations. Version one can prompt only while Sunnie is open; background web push and email reminders are deferred.
- Rise and Unwind use concentrated sunrise/sunset motion and a small focus-pet cameo. Motion follows the user’s reduced-motion preference, and completing rituals does not create streak pressure or a second reward economy.
- Rise and Unwind surfaces, invitations, launch buttons, and the Plan landing-pad progress bar resolve through the active colorway's semantic planning roles rather than fixed Base colors.
- The primary navigation keeps Plan, Calendar, Tasks, and Focus visible while Friends and Settings live under More; the pending-friend indicator remains visible on More. Brain Dump and Tune-up are inside Tasks. Settings are grouped into Personal, Planning, Connections, Notifications & data, and Admin sections.

- `/plan` stores a daily intention and completion state in `DailyPlan`.
- Today’s intention appears in a compact shared reminder beneath the main navigation on every authenticated app page; the empty state links back to Plan with “Set your daily intention!”
- Saving an intention turns the Plan tile into a completed-style card and plays a small celebratory animation. Users can reopen it to make changes.
- “Inspire me” selects from 36 curated built-in quotes with named authors and places one in the intention editor; it does not require AI or an external API. The browser remembers the 10 most recently served quotes and avoids them until fresher choices are used.
- `Task.plannedWeekStart` stores the Sunday for the task’s selected weekly pool.
- The flow is Backlog -> This week -> selected day.
- The Plan page uses a bright daily-planning hero and an interactive three-step landing pad: set an intention, choose today’s tasks, and give those tasks time. The daily workspace presents the intention first, followed by the task list and timeline; weekly planning remains below it and visually teaches the Backlog -> This week -> a day flow. This hierarchy is preserved on mobile as a single readable column.
- The daily landing pad includes a capacity meter based on configured working hours. It combines selected task estimates with the union of timed commitments from enabled calendars inside the work window, excluding all-day events, cancellations, and known mirrored task blocks. Green, amber, and coral states give non-judgmental guidance; days outside configured working days stay open-ended.
- Primary Plan tiles and the Tasks, Friends, Focus, and Settings roots explicitly contain horizontal overflow and allow grid/flex children to shrink. Plan uses narrower gutters below 380px, removes phone-width minimums from its progress tile, and stacks dense manual-time controls at the narrowest width.
- Users can add and remove tasks from a week or day.
- `Schedule day` schedules only unfinished, auto-schedulable tasks selected for that day inside that local-day window.
- `Schedule week` schedules the weekly pool inside the selected Sunday-Saturday window.
- The older shared Tasks/Calendar auto-schedule control still schedules all eligible tasks across a rolling seven-day window.
- Auto-scheduling respects selected working days and keeps the full task interval inside the user's local working hours. It also respects sleep hours, selected-calendar conflicts, task duration, priority, energy, preferred time, real buffer gaps, and locked schedules. Candidate starts use a stable 30-minute grid, and day/week requests cannot spill beyond their requested window.
- Successful scheduling actions identify the requested window, account time zone, first changed block, and protected conflicts/locked times. Their Undo restores only blocks that still match the scheduling result, so a later manual edit is never silently overwritten.
- Placement scores remain internal scheduling data. Confidence/score percentages are intentionally not shown on mobile cards, task rows, task modals, or calendar task details.
- Empty auto-schedule actions show clear guidance and the controls have explanatory hover content.

### Weekly review and completion history

- Plan includes a four-step weekly review: completed tasks and past events, optional reflections, unfinished-task choices, and next-week priorities. Tasks links to history and has a collapsed Completed today section with Undo.
- `WeeklyReview` stores private per-user, per-Sunday reflections, priorities, selected calendars, and completion state in PostgreSQL. Reflections are editable notes, never sent to AI or shared through Friends. Save reflection saves a draft; Finish review marks it complete and immediately shows a persistent completion confirmation. Editing a completed review reopens it. Changing weeks saves pending edits first.
- The weekly-review selector opens with This week first, followed by past weeks from newest to oldest. Upcoming weeks remain available in a separate group after the historical list, keeping review history as the primary path.
- History queries actual `completedAt` in the account timezone in pages of 100. Everyday task requests load active tasks and today's completions. Legacy completions without a timestamp cannot be assigned to a historical week.
- Past events use stored, ended occurrences from the user's calendars, excluding cancellations and known mirrored task blocks. They are read-only memory cues rather than attendance records; users choose which calendars provide that context. Durations are scheduled time, not attendance; all-day events are separate. Lists reflect currently synced data rather than immutable snapshots.
- The unfinished-review step includes open tasks that were assigned to, dated in, scheduled in, or rolled forward from the reviewed week, so older and pre-weekly-planning tasks are not silently omitted.
- Task creation, editing, and Tune-up offer optional Backlog / This week / Next week / Choose week. Missing week assignment never adds a task to Tune-up. Explicit weeks constrain auto-scheduling and are separate from deadlines.
- Unfinished tasks in older weeks roll into the current pool when tasks, scheduling, review, or presence are used. Catch-up after weeks away needs no review or midnight job. Scoped compare-and-update protects concurrent tabs. Backlog and future weeks stay untouched; deadlines, start dates, and locked blocks are preserved. Changing week assignment clears unlocked placements.
- `rolloverCount` and `rolledFromWeek` support a gentle prompt after three weeks. Keep this week, choose a week, Backlog, and Delete are explicit choices. Rollover never deletes tasks, and automatic completed-task deletion remains deferred.
- Fake-data previews are available at `/preview/weekly-review` and within `/preview/plan`.

### Calendar and colors

- Calendar views use the saved account time zone through FullCalendar's named-zone connector. Scheduled task chips, rows, edit details, and scheduling summaries use that same zone and the saved 12/24-hour clock preference, so browser location changes do not shift the displayed plan.
- On portrait phones, Calendar's Week view uses a seven-day date strip and a full-width agenda grouped by day, with readable event and task titles. The desktop time-grid week remains available at wider widths. The mobile week follows the saved first weekday, account time zone, and 12/24-hour format. `/preview/mobile-week` is a fake-data visual preview.
- Sunnie colorways use 14 overarching theme roles plus five mini-palettes: eight event colors, six project colors, six task colors, six friend colors, and four semantic status colors. Each theme therefore contains exactly 44 hex values. `Sunnie Base` and the four seasonal themes keep their stable IDs and item palette slots. Their September 2026 surface refresh draws from the owner's Pinterest board: warmer sketchbook paper and garden green Base, blush-paper Spring, linen and sea-glass Summer, parchment Autumn, and wool-linen Winter. Intention surfaces still use a theme motif: sprout, flower, sun, falling leaf, or snowflake.
- `UserSettings.colorTheme` persists the selected planner colorway. Choosing a colorway in Settings saves and applies it immediately without a page reload. `CalendarFeed`, `CalendarEvent`, and `Project` store stable palette slots separately from custom hexes; browser-local friend colors store slot IDs; scheduled tasks derive a stable slot from their ID. Provider feeds receive deterministic event slots, while explicit custom colors remain fixed. Google, CalDAV, and Outlook refreshes preserve Sunnie-only event slots and overrides. The theme is hydrated for every authenticated route and cached per user rather than in shared browser settings. Settings and item pickers visibly name each theme collection and swatch. The theme provider applies the active registry entry to both the existing HSL design tokens and Sunnie-specific CSS variables.
- `UserSettings.calendarStyle` persists independently as `classic` or `bujo`, so every colorway can use either calendar presentation. `src/lib/planner-themes.ts` layers semantic visual configuration over the stable color registry: reusable grid, border, typography, event, task, and all-day variants are exposed through presentation data attributes rather than theme-ID conditionals. Bujo supports dot-grid, lined-paper, and graph-paper canvases; decorative handwritten headings; highlight, washi, outline, and sticky-note item treatments; and a persistent sticker layer in Month view.
- Bujo paper patterns paint the visible FullCalendar body rather than sitting behind its internal layout layers. Winter outline events retain their palette color as a strong border and text treatment instead of looking like filled Classic cards. Highlight items use soft stationery texture; washi pattern is now an independent presentation primitive with botanical, wildflower, painted-stripe, kraft, starlight, plain, and tiny-check options. Paper-label items add an offset cut-paper treatment. Sticky-note tasks include ruled paper, a small tape tab, and a visible folded corner.
- The visual-theme layer exposes reusable pattern, surface, border, typography, calendar-item, motion, and sticker-pack primitives. A non-selectable visual test pack compiles a deliberately distinct combination into generic DOM attributes, guarding the rule that calendar rendering must not branch on theme IDs.
- The five built-in themes declare distinct stationery art direction in `planner-themes.ts`: Base uses warm garden paper, a dotted sidebar, irregular edges, and botanical tape; Spring uses lined paper, wildflower tape, and a reusable scalloped accent; Summer uses softer linen and painted-stripe tape; Autumn uses kraft-paper cues and its reusable plaid primitive; Winter uses graph paper, starlight tape, and outlined events. Each theme references a typed asset pack with original SVG sticker artwork, signature details, pattern intensity, decorative density, and one-shot motion.
- Admin Settings includes a Theme Lab that previews every built-in colorway plus the non-persistable visual test pack against fake calendar data. Lab controls can mix grid, border, typography, event, task, and all-day primitives without saving account settings; leaving the tab restores the active presentation attributes.

- Calendar views and event creation/editing are retained from FluidCalendar.
- Calendar event reads are range-scoped. The browser requests the visible range with a seven-day buffer, caches loaded ranges, deduplicates rows, and preserves recurring masters needed by the visible occurrences. The authenticated API requires bounded start/end parameters and rejects ranges longer than 400 days. Plan also uses bounded event reads rather than loading a user's complete history.
- Bujo Month exposes a theme-aware Sticker Book. Stickers persist per owner and calendar date in `CalendarSticker`, place optimistically, and can be selected only while sticker editing is active so idle artwork does not block calendar events. Direct drag/scale/rotate controls are lazy-loaded with the Bujo sticker layer; accessible size, rotation, keyboard movement, delete, undo, and failure rollback paths are also provided. Transform changes persist only when the interaction ends.
- Opening Calendar triggers a background sync shortly after hydration. While the tab remains visible, Google/CalDAV feeds and friend availability refresh every five minutes; returning to a stale tab refreshes them as well. The header refresh control runs the same combined pass and exposes the exact last-refresh time on hover.
- Calendar header controls wrap into a deliberate second row below very wide desktop widths. Navigation arrows are not duplicated, the date truncates safely, and compact controls wrap without forcing page-level horizontal scrolling. Previous/next labels follow the selected view, and month/year selectors expose their pressed state.
- The calendar feed sidebar becomes an overlay below 1280px so it cannot crush the calendar canvas. Its persistent right/left edge arrows open and close it on desktop, constrained windows, and mobile; the old hamburger toggle is removed. Hydration re-closes the overlay at constrained widths so a saved desktop preference cannot obscure mobile Calendar.
- Calendar feeds have configurable colors.
- Individual events may have a Sunnie-only color override that survives Google and CalDAV resync.
- The shared event, feed, and task color picker stages palette swatches, recent colors, defaults, and custom colors behind one explicit Apply color action. The event palette offers eight curated Base colors rather than the former 12, followed by a clear `+` custom-color control.
- Event presets are arranged into two balanced four-color groups: Sky & water and Garden & sunset. The smaller set keeps cool, green, warm, and earthy choices while remaining distinct from task and project colors.
- Color choices are applied only after explicit confirmation, avoiding accidental commits while browsing swatches or dragging a custom-color input. Feed color popovers close immediately; their optimistic updates persist in the background and roll back with a toast on request failure.
- Recently used custom colors are saved as quick-access colors.
- Event creation marks title, calendar, start, and end as required and shows an inline error when a calendar is missing.
- Timed events use separate native date and time pickers plus 30-minute, one-hour, 90-minute, and two-hour quick-duration choices.
- Calendar headers include an Add event button on desktop and mobile, while a normal tap/click on an empty calendar slot also opens a pre-filled one-hour event.
- The event modal keeps its header and actions visible, hides horizontal overflow, and collapses optional color/location/notes/recurrence fields to stay compact.
- Scheduled task blocks use rounded, softly filled colors from the active theme's six-color task palette. A task can choose a theme-linked slot or fixed custom hex directly in its editor, independently of tags and priority; tasks without a choice keep a deterministic palette slot.
- Saving only a Sunnie event-color override updates local `CalendarEvent` records optimistically without calling Google, Outlook, or CalDAV or reloading the full calendar. The modal closes as soon as the calendar is updated; the database write finishes in the background and rolls back the affected colors with a toast if it fails. Equivalent recurrence serializations such as `RRULE:FREQ=WEEKLY` and `FREQ=WEEKLY` do not turn a cosmetic edit into a provider update. A recurring-series color choice updates its master and instances together, while a single-occurrence choice remains scoped to that row. Genuine provider series rebuilds remove rows linked by either the local master relation or provider recurring ID before inserting refreshed instances, preventing duplicates.
- Editing the duration or time of a later recurring occurrence as a series keeps the master event anchored to its original first date. Google, CalDAV, and inherited Outlook updates apply the occurrence's time change and new duration to the master instead of using the clicked occurrence's date. Unchanged recurrence controls preserve provider rule limits such as `COUNT` and `UNTIL`.
- Tasks of 30 minutes or less use a compact time-grid layout that keeps the normal title font size, uses a smaller check icon and reduced padding, and exposes the full title on hover so 15-minute blocks remain readable without zooming the calendar. Every calendar task retains a check icon.
- Event and task deletion confirmations use a Sunnie-styled in-app dialog instead of the browser's native confirmation box. Errors remain readable inside that dialog.
- Synced event deletion waits only for the connected provider to confirm removal. Sunnie then removes the event locally and performs database reconciliation plus auto-scheduling in the background, so the modal no longer stays blocked on those follow-up passes.

### Focus and friend visibility

- Focus mode begins with one combined round-planning screen: users choose a 5- or 10-minute setup, 15-, 25-, 45-, or 60-minute focus round, and 5-, 10-, or 15-minute break at the same time. The UI clearly previews the complete sequence, and focus starts automatically when setup ends.
- Focus timers survive refreshes in the same browser, update the browser-tab countdown, support pause/resume/end-early controls, and play the selected chime when setup, focus, or break time ends. Users can preview and choose Soft sunrise, Garden bells, or Cozy wooden, and can disable timer sounds.
- The setup checklist covers a drink/snack, workspace, subtasks, and distractions. The user's subtask outline remains visible during setup and focus instead of disappearing between phases.
- Ending setup early cancels the setup instead of advancing into focus. A completed focus round shows a reward only after the server confirms the award, while an early-ended focus round uses truthful no-reward copy. The no-task state explains the ritual and links directly to task creation.
- Users can choose among six built-in emoji focus pets. Completed focus rounds earn non-punitive “sun drops,” and the pet changes its encouragement across setup, focus, pause, and break phases.
- Completing any previously unfinished task awards one sun drop, including completion from Tasks, Calendar, Focus, or the Focus sidebar. The authenticated total is stored in `UserSettings.sunDrops` and syncs across devices; local storage is only a cache/offline fallback and migrates an existing browser total upward once. Marking a task incomplete does not remove the earned drop, and repeatedly saving an already-completed task does not award duplicates.
- A custom pet or inspiration photo up to 750 KB can be stored only in that browser's local storage; it is never uploaded to Sunnie or shared across devices.
- The Focus card shows the task's energy, urgency/priority, estimate, and description. The inherited schedule-fit score is intentionally not shown.
- The separate right-side quick-actions panel was removed. At the end of every focus round, the timer offers Complete task and Edit task alongside break/continue choices.
- A finished focus round names the task and minutes protected, makes Complete task the primary next action when needed, and keeps another round visually secondary.
- The Focus task queue has the same persistent side-arrow collapse control on desktop and mobile.
- Accepted friends can expose busy-only or more detailed calendar/focus information according to each side’s visibility selection.
- Accepted friends appear only in Day, Week, Month, and Multi-month Calendar views as non-interactive background availability lanes; friend availability is intentionally excluded from the Plan timeline. Friend markers have no title or hover content and never intercept slot clicks, so users can create their own events through them. Each accepted friend has a persisted show/hide checkbox in the calendar feed sidebar, alongside their current inbound sharing level, so pending, locally hidden, or permission-hidden relationships are obvious.
- The Friends navigation tab shows a warm notification dot while an incoming friend request is pending, on desktop and mobile.
- Accepted friend rows show a privacy-friendly online/offline dot derived from the existing five-minute presence heartbeat window. Exact last-active timestamps are not exposed to other users.
- Each accepted friend has a persisted local display color chosen from a dedicated six-color pastel palette in the Calendar sidebar. All event and focus periods from that friend use the same selected color regardless of source-calendar color. Friends are assigned stable parallel 5px lanes at the left edge of each affected time span, preventing overlapping translucent fills while keeping them visually behind the user's editable plan.

### Admin presence

- Every visible authenticated Sunnie tab sends a lightweight heartbeat once per minute.
- `User.lastActiveAt` stores only the latest timestamp; Sunnie does not store page-by-page activity history.
- Admins can open **Settings -> Online** to see online-now, active-today, and total-account counts plus recent users.
- “Online now” means a heartbeat was received during the previous five minutes, so the value is intentionally approximate.
- `/api/presence` can update only the authenticated user, and `/api/admin/presence` is protected by server-side admin authorization.

## Discord Release Announcements

Workflow: `.github/workflows/discord-updates.yml`

- Trigger: GitHub `deployment_status` events from Railway, plus optional manual dispatch.
- A normal announcement runs only after Railway reports `success`.
- The message says `Live now - ready to try!` and links to production and the commit.
- A headless Chromium process captures a fake-data preview at 1440x1000. Brain Dump, Calendar, Focus, Tasks, and onboarding releases select their matching preview; other releases use `/preview/plan`.
- The screenshot is attached directly to the Discord webhook message.
- If screenshot capture fails, the text announcement still posts.
- Commits that change only `.github/` automation are skipped.
- A commit title containing `[skip discord]` is skipped.
- Use clear feature commit subjects and bodies because they become the Discord title and description.
- Batch a user request into one user-facing commit where practical. Mark follow-up infrastructure-only commits `[skip discord]` to avoid duplicate announcements.

Preview routes under `src/app/preview` are public and contain fake data only. Keep them visually aligned with meaningful UI changes. Never place real user data, credentials, or private calendar information in a preview route.

The inherited `.github/workflows/docker-publish.yml` targets the upstream maintainer’s Docker Hub image and credentials. It is intentionally manual-only and must not be re-enabled on every push unless Sunnie gets its own registry and credentials.

## Development and Verification

Sunnie's local and Railway runtimes use Node 22. The tested Windows patch release is pinned in `.nvmrc`, and `package.json` restricts the project to Node 22.x. If `node`, `npm.cmd`, or `npx.cmd` is missing on Windows, install the matching major version with:

```powershell
winget install --id OpenJS.NodeJS.22 --exact --source winget
```

Close and reopen VS Code and all terminals after installation so they inherit `C:\Program Files\nodejs` from the machine `PATH`. The checked-in `.huskyrc` also falls back to that standard Windows location so Git hooks continue to work from an editor that was already open during installation. Do not install winget's generic `OpenJS.NodeJS.LTS` package without checking its major version; it may be newer than the Node 22 production runtime. Verify recovery with `node --version`, `npm.cmd --version`, and `npm.cmd run db:setup`.

PowerShell may block `npm.ps1`. Prefer `npm.cmd` and `npx.cmd`:

```powershell
npm.cmd run prisma:generate
npm.cmd run lint
npm.cmd run type-check
npm.cmd run build
npm.cmd run test:unit -- --runInBand
npm.cmd run dev
```

Minimum verification for ordinary UI or API work:

1. Run Prettier on touched source files.
2. Run `git diff --check`.
3. Run lint and type checking.
4. Run focused unit tests when relevant.
5. Run the production build for routing, schema, auth, Docker, or deployment-sensitive changes.
6. Visually inspect responsive UI changes at mobile, constrained desktop, and wide desktop widths when browser tooling is available.

There is an existing Windows-only Next.js standalone trace warning about a missing `route_client-reference-manifest.js` for `/api/task-sync/sync`. The production build currently exits successfully despite that warning. Do not describe a build as failed solely because of this warning; investigate if the exit code becomes nonzero or Railway fails.

Pre-commit hooks run lint and TypeScript checks. Preserve unrelated user changes in a dirty worktree.

## Safety and Maintenance Rules

- Never commit `.env`, OAuth secrets, webhook URLs, database URLs, tokens, app-specific passwords, or production user data.
- Never log complete auth payloads or provider credentials.
- Keep all API reads and writes scoped by authenticated `userId`.
- Task project/tag relationships are validated against the authenticated owner, and task routes accept only explicit mutable scalar fields rather than forwarding arbitrary Prisma relationship input.
- Calendar-provider OAuth connection requests require an authenticated, signed, short-lived state value bound to the current user and provider.
- Client log batches require authentication; log browsing and cleanup require admin authorization. Disabled logging must reject both individual and batch persistence.
- Keep preview routes fake-data-only.
- Use migrations for database changes and verify Railway startup can apply them.
- Do not use destructive Prisma or Git commands against production data.
- Preserve the Sunnie theme when adding or modifying UI.
- Treat mobile and constrained-width desktop behavior as part of feature completion.
- Update this file whenever architecture, hosting, integrations, major features, deployment automation, or important known limitations change.

## Current Known Follow-Ups

- Some inherited technical docs and package scripts still describe upstream SaaS, Infisical, or registry workflows. The root README and `docs/local-postgres.md` describe Sunnie's supported setup; audit legacy instructions before using them.
- Outlook implementation remains partially exposed and needs a deliberate removal pass if it is no longer wanted.
- Google OAuth availability depends on correct production URLs, scopes, consent mode, verification state, and approved test users.
- Calendar/provider credentials deserve an encryption-at-rest review before use outside the trusted friend/family group.
- Friends and Settings releases still use the planning preview; future major changes to those surfaces may benefit from matching fake-data preview routes.
- Continue mobile visual QA as features are added; inherited FluidCalendar layouts were desktop-first.
