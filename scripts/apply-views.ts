import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptsPath = path.join(__dirname, "views");
const viewFiles = fs.readdirSync(scriptsPath);
console.log("Creating views...");

const databaseUrl = process.env.DATABASE_URL || "";
const psqlUrl = getDbUrl(databaseUrl);
const schema = process.env.REPORTING_SCHEMA || "reporting";

// Drop and recreate reporting schema (if mode is not delete)
deleteViews();
const mode = process.argv[2];
if (mode === "delete") {
  process.exit(0);
}

createSchema();
applyViews();

// Utils
function deleteViews() {
  runPsqlOrExit(
    "psql",
    [
      psqlUrl,
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      `DROP SCHEMA IF EXISTS "${schema}" CASCADE;`,
    ],
    `✅ Schema "${schema}" deleted`,
    `❌ Failed to delete schema "${schema}"`
  );
}

function createSchema() {
  runPsqlOrExit(
    "psql",
    [
      psqlUrl,
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      `CREATE SCHEMA "${schema}";`,
    ],
    `✅ Schema "${schema}" created`,
    `❌ Failed to create schema "${schema}"`
  );
}

function applyViews() {
  for (const file of viewFiles) {
    console.log(`➡️ Applying ${file}`);
    runPsqlOrExit(
      "psql",
      [
        psqlUrl,
        "-v",
        "ON_ERROR_STOP=1",
        "-v",
        `SCHEMA=${schema}`,
        "-f",
        path.join(scriptsPath, file),
      ],
      `✅ Applied ${file}`,
      `❌ Failed to apply ${file}`
    );
  }
  console.log("Views created successfully");
}

function getDbUrl(rawDatabaseUrl: string): string {
  try {
    const parsedUrl = new URL(rawDatabaseUrl);
    parsedUrl.search = ""; // to drop everything after a "?"
    return parsedUrl.toString();
  } catch {
    return rawDatabaseUrl;
  }
}

function runPsqlOrExit(
  cmd: string,
  args: string[],
  successMsg?: string,
  failureMsg?: string
): void {
  try {
    execFileSync(cmd, args, { stdio: "inherit" });
    if (successMsg) {console.log(successMsg);}
  } catch (error: unknown) {
    if (failureMsg) {console.error(failureMsg);}
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error
    ) {
      console.error(`Exit code: ${(error as { status?: number }).status}`);
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "stderr" in error
    ) {
      const stderr = (error as { stderr?: unknown }).stderr;
      if (stderr) {console.error(String(stderr));}
    }
    process.exit(1);
  }
}
