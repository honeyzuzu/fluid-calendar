# Sunnie Planner

A private planner for the owner, friends, and family, built from the open-source [FluidCalendar](https://github.com/dotnetfactory/fluid-calendar) project and inspired by Sunsama. Sunnie combines a warm, pastel interface with daily planning, calendar sync, and automatic time blocking.

## What Sunnie does

- Manage tasks and projects, capture a Brain Dump, and refine unfinished details with Task Tune-up from one Tasks workspace.
- Begin with a playful Daily Rise, close with a private Daily Unwind, and plan from Backlog to This week to a selected day without repeating the weekly review.
- Schedule tasks around calendar conflicts, working hours, sleep hours, and locked blocks.
- Review completed tasks and past events, save private weekly reflections, and choose next-week priorities.
- Connect Google Calendar, Apple Calendar, and compatible CalDAV providers.
- Run focus rounds with setup time, breaks, chimes, pets, and sun drops.
- Share optional calendar availability with accepted friends, with individual privacy controls.

The application supports desktop and mobile. Public signup defaults to off; the initial admin can temporarily enable it to onboard friends. Outlook code remains partially exposed from upstream; see [AGENTS.md](AGENTS.md) for the current integration caveats and detailed feature inventory.

## Local development on Windows

Prerequisites: Node.js 22, npm, and Docker Desktop running Linux containers. On Windows, install the same Node major version used by Railway, then restart VS Code and any open terminals so the updated `PATH` is loaded:

```powershell
winget install --id OpenJS.NodeJS.22 --exact --source winget
node --version
npm.cmd --version
```

Do not use winget's generic Node.js LTS package for this project without checking the version first; it may install a newer major than Sunnie's Node 22 runtime. The exact tested patch release is recorded in `.nvmrc`.

From this checkout:

1. Install dependencies with `npm.cmd ci --legacy-peer-deps`.
2. Copy `.env.example` to `.env` only if `.env` does not already exist. Configure a private local `NEXTAUTH_SECRET` of at least 32 characters and keep the local application URLs.
3. Start and initialize the isolated local database, then run the app:

   ```powershell
   npm.cmd run db:setup
   npm.cmd run dev
   ```

4. Open `http://localhost:3000/setup` to create the first local admin account.

Local PostgreSQL 16 uses `127.0.0.1:5433` and database `sunnie_local`. See [local PostgreSQL setup](docs/local-postgres.md) for daily commands and persistence details. Keep production database credentials out of local configuration.

The Compose `app` service still uses the upstream published FluidCalendar image. For Sunnie source development, run only the local database through the commands above and run Next.js locally.

### Quick Start with Docker

The inherited Compose stack can still launch the published upstream application for reference with `docker compose up -d`; it does not contain current Sunnie source changes. Copy `.env.example` to `.env` first and keep `NEXTAUTH_URL=http://localhost:3000` when using the default port mapping.

**Note on the port:** the application container always listens on port 3000. A `PORT` value in `.env` does not change the container port declared under Compose `ports`. If you remap the host side—for example, `8080:3000`—also set `NEXTAUTH_URL` to that exact public origin, such as `http://localhost:8080`, or authentication callbacks will fail.

## Production and integrations

Sunnie is one Next.js 15 / React 19 application with TypeScript, Tailwind, FullCalendar, Zustand, NextAuth, and Prisma 6 backed by PostgreSQL.

Production is hosted on Railway at [Sunnie Planner](https://sunnie-planner-prod.up.railway.app). Pushing `main` in this repository triggers a deployment using the root `Dockerfile`. Startup waits for PostgreSQL, generates Prisma Client, applies checked-in migrations with `prisma migrate deploy`, and starts the standalone Next.js server on port 3000. Production does not depend on a developer's computer staying on.

Schema changes require checked-in migrations. Do not substitute `prisma db push`; the account uniqueness migration includes PostgreSQL behavior that Prisma's schema DSL cannot fully express.

Google integration requires OAuth configuration for the deployed origin and both sign-in and calendar callbacks. Apple Calendar uses an Apple app-specific password through CalDAV. See [integration and environment configuration in AGENTS.md](AGENTS.md#calendar-integrations) for the project-specific setup. Keep tokens, passwords, and webhook URLs out of source control.

Sunnie's private deployment keeps SaaS features disabled. Redis workers, Kubernetes, Infisical, and upstream Docker publishing scripts remain inherited code and are not the normal Sunnie deployment workflow.

## Google Cloud Setup

Set `NEXTAUTH_URL` to the exact public URL where Sunnie is served. Register that same origin in Google Cloud and add both redirect URIs:

```text
https://your-sunnie-host.example/api/auth/callback/google
https://your-sunnie-host.example/api/calendar/google
```

The consent screen must allow the scopes Sunnie requests:

```text
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/tasks
```

Google accepts `localhost` for local testing but rejects private IP addresses and `.local` hostnames as authorized web origins. Use a real HTTPS hostname when another device needs to complete OAuth. If the consent screen is in testing mode, add every Sunnie user as an approved test user.

## Microsoft Outlook Setup

Outlook support remains partially exposed from the upstream project. If it is configured, register this calendar-connection redirect URI in Microsoft Entra:

```text
https://your-sunnie-host.example/api/calendar/outlook
```

The redirect origin must match `NEXTAUTH_URL` exactly.

## Working on the project

- [AGENTS.md](AGENTS.md): implemented behavior, architecture, safety rules, and verification requirements.
- [FEATURE_IDEAS.md](FEATURE_IDEAS.md): your informal feature brain dump and ideas to discuss.
- [@TODO.md](@TODO.md): selected implementation work and maintenance candidates.
- [Local PostgreSQL guide](docs/local-postgres.md): development database setup.
- [Colorway worksheet](docs/colorways.md): exact global and item-palette roles for every planner theme.
- `src/app` and `src/components`: routes and interface components.
- `src/services/scheduling`: automatic scheduling.
- `prisma/schema.prisma` and `prisma/migrations`: data model and migrations.
- `src/app/preview`: public preview pages containing fake data only.

Older upstream plans are retained in `docs/_old/`. Other inherited technical documentation may still describe upstream workflows; check it against the current code and Sunnie setup before using it.

For ordinary UI or API changes, format touched files, run `git diff --check`, lint, and type checking; add focused tests and a production build when required by [AGENTS.md](AGENTS.md#development-and-verification).

```powershell
npm.cmd run lint
npm.cmd run type-check
npm.cmd run test:unit -- --runInBand
npm.cmd run build
```

## License and attribution

Sunnie Planner is derived from [dotnetfactory/FluidCalendar](https://github.com/dotnetfactory/fluid-calendar). The project retains the [MIT license](LICENSE) and upstream copyright notice.
