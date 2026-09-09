# Local PostgreSQL

Sunnie uses a separate PostgreSQL 16 database for local development. Railway's
database remains production-only.

## First-time setup on Windows

1. Install Docker Desktop and start it.
2. Copy `.env.example` to `.env` if `.env` does not exist.
3. Give `NEXTAUTH_SECRET` in `.env` a private local value of at least 32
   characters.
4. Run:

   ```powershell
   npm.cmd run db:setup
   npm.cmd run dev
   ```

5. Open `http://localhost:3000/setup` to create a local-only admin account.

The development connection is:

```text
Host: 127.0.0.1
Port: 5433
Database: sunnie_local
User: sunnie_local
```

The password is a development-only value stored in `docker-compose.yml`. Do not
reuse it outside this local database.

## Everyday commands

```powershell
npm.cmd run db:up       # Start PostgreSQL without starting the upstream app image
npm.cmd run db:status   # Show container health
npm.cmd run db:logs     # Show recent PostgreSQL logs
npm.cmd run db:down     # Stop PostgreSQL and preserve local data
npm.cmd run dev         # Run the Sunnie source tree locally
```

`db:setup` waits for PostgreSQL, then applies checked-in migrations with
`prisma migrate deploy`. The setup script forces the isolated local URL while it
runs, so it cannot migrate Railway even if another shell variable is set. Local
data persists in the `postgres_dev_data` Docker volume when the container stops.

Never paste Railway's `DATABASE_URL` into `.env`. Railway injects its production
connection into the deployed service independently.
