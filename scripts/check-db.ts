import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Run with --env-file=.env.local");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1 });

try {
  const [info] = await sql`select current_database() as db, version() as pg`;
  console.log("Connected:", info.db);

  const tables = await sql<{ table_name: string }[]>`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
    order by table_name
  `;
  console.log("Public tables:", tables.map((t) => t.table_name));

  const expected = [
    "applications",
    "contacts",
    "interactions",
    "application_status_events",
  ];
  const found = new Set(tables.map((t) => t.table_name));
  const missing = expected.filter((name) => !found.has(name));
  console.log(
    missing.length === 0
      ? "All expected tables are present."
      : `Missing tables: ${missing.join(", ")}`,
  );
} catch (err) {
  console.error("Connection or query failed:", err);
  process.exitCode = 1;
} finally {
  await sql.end();
}