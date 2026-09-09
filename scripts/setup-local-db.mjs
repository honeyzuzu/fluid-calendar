import { spawnSync } from "node:child_process";

const localDatabaseUrl =
  "postgresql://sunnie_local:sunnie_local@127.0.0.1:5433/sunnie_local";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: localDatabaseUrl },
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });

  if (result.error?.code === "ENOENT") {
    console.error(
      `${command} is unavailable. Install and start Docker Desktop, then run this command again.`
    );
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("Starting the isolated Sunnie database at 127.0.0.1:5433...");
run("docker", ["compose", "up", "db", "-d", "--wait"]);
run("npx.cmd", ["prisma", "generate"]);
run("npx.cmd", ["prisma", "migrate", "deploy"]);
console.log("Local PostgreSQL is ready. Run npm.cmd run dev to start Sunnie.");
