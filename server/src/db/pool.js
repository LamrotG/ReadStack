import pg from "pg";

const { Pool, types } = pg;

// Return date columns as plain "YYYY-MM-DD" strings instead of JS Date objects
// to avoid server-TZ shifts in JSON responses.
types.setTypeParser(1082, (val) => val);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
