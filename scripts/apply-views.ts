import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viewsDir = path.join(__dirname, "views");
const viewFiles = fs.readdirSync(viewsDir);

const psqlUrl = getDbUrl(process.env.DATABASE_URL ?? "");
const schema = process.env.REPORTING_SCHEMA ?? "reporting";
const baseArgs = [psqlUrl, "-v", "ON_ERROR_STOP=1"];

console.log("Creating views...");

psql([
  ...baseArgs,
  "-c",
  `
  DO $$ BEGIN
    EXECUTE COALESCE(
      (SELECT string_agg('DROP VIEW IF EXISTS ' || schemaname || '.' || viewname || ' CASCADE', '; ')
       FROM pg_catalog.pg_views WHERE schemaname = '${schema}'),
      'SELECT 1'
    );
  END $$;
`,
]);
console.log(`✅ Views in schema "${schema}" deleted`);

if (process.argv[2] === "delete") process.exit(0);

psql([...baseArgs, "-c", `CREATE SCHEMA IF NOT EXISTS "${schema}";`]);
console.log(`✅ Schema "${schema}" created`);

for (const file of viewFiles) {
  console.log(`➡️  Applying ${file}`);
  const ok = psql(
    [...baseArgs, "-v", `SCHEMA=${schema}`, "-f", path.join(viewsDir, file)],
    false
  );
  console.log(ok ? `✅ Applied ${file}` : `⚠️  Skipping ${file}`);
}

console.log("Views created successfully");

function psql(args: string[], exitOnError = true): boolean {
  try {
    execFileSync("psql", args, { stdio: "inherit" });
    return true;
  } catch (err: any) {
    console.error(`psql failed (exit code ${err?.status}): ${err?.message}`);
    if (exitOnError) process.exit(1);
    return false;
  }
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
