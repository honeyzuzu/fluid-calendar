# Sunnie Planner Project State

Last updated: 2026-09-02

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

- Local repository: `C:\Users\queen\friend-planner`
- GitHub repository: `https://github.com/honeyzuzu/fluid-calendar`
- Primary branch: `main`
- Upstream source: `https://github.com/dotnetfactory/fluid-calendar`
- Production URL: `https://sunnie-planner-prod.up.railway.app`
- Hosting: Railway
- Database: Railway-managed PostgreSQL
- Application port: `3000`

Git remotes normally are:

```text
origin    https://github.com/honeyzuzu/fluid-calendar.git
upstream  https://github.com/dotnetfactory/fluid-calendar.git
```

Pushing `main` triggers Railway deployment. The owner’s computer and local Docker do not need to remain running for friends to use production. Production data persists in PostgreSQL and is not stored only inside the disposable application container.

After pushing a verified change, do not poll, watch, or wait for Railway deployments or Discord workflow runs. Hand the push off and let those services finish asynchronously unless the user explicitly asks for a specific deployment check.

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

### Sunnie identity and responsive UI

- App name, metadata, favicon, Google OAuth logo, setup page, sign-in page, settings, and primary application surfaces use Sunnie branding.
- Visual language uses warm cream backgrounds, sunny yellow accents, leafy greens, peach, pastel colors, rounded cards, and the Sunnie sun icon.
- Motion is intentionally restrained: task cards gently rise on entry, calendar task blocks lift slightly on hover, focus pets respond subtly, and sun-drop badges use a one-shot pop. All custom motion respects reduced-motion preferences.
- Task completion uses a slow 2.8-second sunny bloom and one light pastel confetti shower rather than a rapid repeated burst.
- The former bottom-right “island” control was removed.
- Mobile layouts exist for the main navigation, calendar, tasks, focus, settings, and related screens. The fixed mobile navigation is 5rem tall with larger 20px icons and 11px labels, plus safe-area padding for phones with home indicators.
- Below 1024px, primary app destinations use the fixed mobile icon bar instead of squeezing or dropping the desktop navigation. Between 1024px and 1280px, the top navigation remains compact and icon-only.
- The detailed Tasks table is reserved for windows at least 1800px wide. Smaller desktop widths use a dense two-, three-, or four-column card grid while mobile stays single-column, so cards do not become wastefully wide and users are not forced to discover a hidden horizontal scrollbar.
- The upstream support banner on the calendar is intentionally compact.

### First-time onboarding

- `UserSettings.onboardingVersion` stores the latest completed welcome-tour version. Version `2` adds sleep-hours setup. Accounts that completed version 1 but have not configured sleep hours receive only the short sleep-hours update rather than repeating the full tour.
- `UserSettings.sleepHoursStart`, `sleepHoursEnd`, and `sleepHoursConfigured` persist the user's normal rest window in PostgreSQL. Bedtime and wake-up are editable under User Settings as well as onboarding. Auto-scheduling filters out every slot that overlaps the configured window, including overnight windows, and authenticated manual task updates reject scheduled times that overlap it.
- The authenticated common layout opens a required one-time onboarding flow. It first explains Sunnie, embeds the existing Google/Apple/CalDAV account manager, lets the user enable or hide imported calendars, asks for sleep hours, and then shows brief page-level bubbles for Calendar, Tasks, Brain Dump, Plan, Friends, and Focus.
- New-user onboarding creates a small user-named practice task on the Tasks step, selects it in Focus, and immediately opens Focus next so the combined setup/focus/break Pomodoro controls are visible during the tour.
- Tour progress survives same-tab OAuth redirects through session storage, while completion is persisted per user in PostgreSQL by `/api/onboarding`.
- Each step contains a short curated quote with its author. The tour has Back/Next controls but no permanent skip; an interrupted user resumes until the current version is completed.

### Tasks and projects

- Tasks support status, title, descriptions, start/due dates, duration, priority, energy, preferred time, tags, projects, recurrence, and external sync metadata.
- Tasks default to `isAutoScheduled = true`; users opt out rather than opt in.
- Manual calendar placement locks a task so later auto-scheduling does not unexpectedly move it.
- Task list and board views are inherited and retained.
- The Tasks workspace is centered at a readable maximum width. Its filters form a compact toolbar on desktop, list cards gain columns as space permits, and board columns stay centered rather than leaving the content stranded against one edge.
- The Focus task queue gives every task a dedicated completion toggle. Completed tasks can be marked incomplete from the same control.
- Project organization, filtering, sorting, tags, recurrence, and task sync are retained from FluidCalendar.
- Projects use a separate warm pastel palette from calendar events. Their sidebar entries are full-color tiles; project color is organizational identity only and does not recolor the tasks inside the project.
- Filled task, event, and project surfaces choose warm white text by default and switch to Sunnie's soft near-black when WCAG contrast would otherwise be poor. The project picker is visible as a horizontal chip row on mobile Tasks screens.
- Tasks in both list and board layouts can be dragged onto a project tile in the desktop sidebar to reassign them, or onto the remove-project drop zone to unassign them.
- Board status columns share the app-wide drag context. A high-layer task preview follows the pointer above every column while dragging, and dropping on a status updates the task. Board cards use a dedicated touch-safe grip with a shorter hold and more movement tolerance so mobile scrolling and task actions do not fight the drag gesture.
- The task board stacks its status columns on phones and uses three fluid columns from tablet widths upward; it does not rely on fixed 320px columns or a hidden horizontal scrollbar. The desktop Projects panel collapses to a slim arrow rail and reserves layout space whenever opened, including on constrained windows; the mobile project chip list can also be folded with the same side-arrow language.
- Calendar, Projects, and Focus sidebar controls use attached rectangular edge tabs with one seamless flat side instead of detached circular buttons. Calendar and Projects each render one persistent toggle outside the panel transform, preventing doubled controls, clipped click targets, or missing tabs at wide breakpoints; tab and panel surfaces use the same background color. Opening the desktop Projects panel always expands its parent layout width from a slim rail to 256px, including constrained desktop windows, so Tasks list/board content shifts rather than sitting underneath it; the panel itself uses an opaque warm-cream surface.

### Brain Dump and task tune-up

- `/brain-dump` turns each non-empty line or common list item into a separate auto-schedulable task; repeated lines in the same dump are ignored.
- Brain Dump is deterministic and does not require an AI provider. Users should put one thought on each line; optional AI paragraph interpretation is a possible later enhancement.
- Unsaved brain-dump text is retained only in that browser's local storage. Submitted items become normal database-backed tasks.
- Task Tune-up cycles flashcard-style through every active task that is missing a duration, due date, priority, or energy level, including tasks created elsewhere in Sunnie. Due date uses the native date picker and is required before saving a tune-up card.
- Each tune-up card also exposes task status. Completed tasks are excluded from the tune-up queue.

### Daily and weekly planning

- `/plan` stores a daily intention and completion state in `DailyPlan`.
- Today’s intention appears in a compact shared reminder beneath the main navigation on every authenticated app page; the empty state links back to Plan with “Set your daily intention!”
- Saving an intention turns the Plan tile into a completed-style card and plays a small celebratory animation. Users can reopen it to make changes.
- “Inspire me” selects from 36 curated built-in quotes with named authors and places one in the intention editor; it does not require AI or an external API. The browser remembers the 10 most recently served quotes and avoids them until fresher choices are used.
- `Task.plannedWeekStart` stores the Monday for the task’s selected weekly pool.
- The flow is Backlog -> This week -> selected day.
- The Plan page begins with an interactive three-step daily landing pad: set an intention, choose today’s tasks, and give those tasks time. On mobile, the intention card appears before the task list and timeline; weekly planning remains available below the daily workspace.
- Primary Plan tiles and the Tasks, Brain Dump, Friends, Focus, and Settings roots explicitly contain horizontal overflow and allow grid/flex children to shrink. Plan uses narrower gutters below 380px, removes phone-width minimums from its progress tile, and stacks dense manual-time controls at the narrowest width.
- Users can add and remove tasks from a week or day.
- `Schedule day` schedules only unfinished, auto-schedulable tasks selected for that day inside that local-day window.
- `Schedule week` schedules the weekly pool inside the selected Monday-Sunday window.
- The older shared Tasks/Calendar auto-schedule control still schedules all eligible tasks across a rolling seven-day window.
- Auto-scheduling respects existing calendar conflicts, work hours, duration, priority, energy, preferred time, buffers, and locked schedules.
- Empty auto-schedule actions show clear guidance and the controls have explanatory hover content.

### Calendar and colors

- Calendar views and event creation/editing are retained from FluidCalendar.
- Opening Calendar triggers a background sync shortly after hydration. While the tab remains visible, Google/CalDAV feeds and friend availability refresh every five minutes; returning to a stale tab refreshes them as well. The header refresh control runs the same combined pass and exposes the exact last-refresh time on hover.
- Calendar header controls wrap into a deliberate second row below very wide desktop widths. Navigation arrows are not duplicated, the date truncates safely, and the control row scrolls only when a phone is too narrow, preventing buttons and labels from collapsing into one another.
- The calendar feed sidebar becomes an overlay below 1280px so it cannot crush the calendar canvas. Its persistent right/left edge arrows open and close it on desktop, constrained windows, and mobile; the old hamburger toggle is removed.
- Calendar feeds have configurable colors.
- Individual events may have a Sunnie-only color override that survives Google and CalDAV resync.
- The color picker includes a pastel Sunnie rainbow plus a custom color input.
- Event presets are arranged into three balanced groups: Sky & twilight, Sea & garden, and Sunset & earth. The 12-color set adds teal, deeper sage/pine, apricot, tangerine, clay, and cocoa alongside blues and purples, while remaining distinct from task urgency and project colors.
- Custom colors are applied only after explicit confirmation, avoiding accidental commits while dragging.
- Recently used custom colors are saved as quick-access colors.
- Event creation marks title, calendar, start, and end as required and shows an inline error when a calendar is missing.
- Timed events use separate native date and time pickers plus 30-minute, one-hour, 90-minute, and two-hour quick-duration choices.
- Calendar headers include an Add event button on desktop and mobile, while a normal tap/click on an empty calendar slot also opens a pre-filled one-hour event.
- The event modal keeps its header and actions visible, hides horizontal overflow, and collapses optional color/location/notes/recurrence fields to stay compact.
- Scheduled task blocks use rounded, softly filled pastel urgency colors rather than a blue block with a hard side stripe. High is coral, medium is sunny gold, low is mint, and tasks without a priority are lavender.
- Tasks of 30 minutes or less use a compact time-grid layout that keeps the normal title font size, uses a smaller check icon and reduced padding, and exposes the full title on hover so 15-minute blocks remain readable without zooming the calendar. Every calendar task retains a check icon.
- Event and task deletion confirmations use a Sunnie-styled in-app dialog instead of the browser's native confirmation box. Errors remain readable inside that dialog.
- Synced event deletion waits only for the connected provider to confirm removal. Sunnie then removes the event locally and performs database reconciliation plus auto-scheduling in the background, so the modal no longer stays blocked on those follow-up passes.

### Focus and friend visibility

- Focus mode begins with one combined round-planning screen: users choose a 5- or 10-minute setup, 15-, 25-, 45-, or 60-minute focus round, and 5-, 10-, or 15-minute break at the same time. The UI clearly previews the complete sequence, and focus starts automatically when setup ends.
- Focus timers survive refreshes in the same browser, update the browser-tab countdown, support pause/resume/end-early controls, and play the selected chime when setup, focus, or break time ends. Users can preview and choose Soft sunrise, Garden bells, or Cozy wooden, and can disable timer sounds.
- The setup checklist covers a drink/snack, workspace, subtasks, and distractions. The user's subtask outline remains visible during setup and focus instead of disappearing between phases.
- Users can choose among six built-in emoji focus pets. Completed focus rounds earn non-punitive “sun drops,” and the pet changes its encouragement across setup, focus, pause, and break phases.
- Completing any previously unfinished task awards one sun drop, including completion from Tasks, Calendar, Focus, or the Focus sidebar. The authenticated total is stored in `UserSettings.sunDrops` and syncs across devices; local storage is only a cache/offline fallback and migrates an existing browser total upward once. Marking a task incomplete does not remove the earned drop, and repeatedly saving an already-completed task does not award duplicates.
- A custom pet or inspiration photo up to 750 KB can be stored only in that browser's local storage; it is never uploaded to Sunnie or shared across devices.
- The Focus card shows the task's energy, urgency/priority, estimate, and description. The inherited schedule-fit score is intentionally not shown.
- The separate right-side quick-actions panel was removed. At the end of every focus round, the timer offers Complete task and Edit task alongside break/continue choices.
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

On this Windows machine, PowerShell may block `npm.ps1`. Prefer `npm.cmd` and `npx.cmd`:

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
- Keep preview routes fake-data-only.
- Use migrations for database changes and verify Railway startup can apply them.
- Do not use destructive Prisma or Git commands against production data.
- Preserve the Sunnie theme when adding or modifying UI.
- Treat mobile and constrained-width desktop behavior as part of feature completion.
- Update this file whenever architecture, hosting, integrations, major features, deployment automation, or important known limitations change.

## Current Known Follow-Ups

- The upstream README still contains FluidCalendar branding and Outlook/SaaS material that does not fully describe Sunnie.
- Outlook implementation remains partially exposed and needs a deliberate removal pass if it is no longer wanted.
- Google OAuth availability depends on correct production URLs, scopes, consent mode, verification state, and approved test users.
- Calendar/provider credentials deserve an encryption-at-rest review before use outside the trusted friend/family group.
- Friends and Settings releases still use the planning preview; future major changes to those surfaces may benefit from matching fake-data preview routes.
- Continue mobile visual QA as features are added; inherited FluidCalendar layouts were desktop-first.
