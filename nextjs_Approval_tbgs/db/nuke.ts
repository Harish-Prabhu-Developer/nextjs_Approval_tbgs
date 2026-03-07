import { sql } from "drizzle-orm";
import { db } from "./index";

async function reset() {
  console.log("Dropping all tables in the public schema...");

  try {
    await db.execute(sql`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    console.log("All tables dropped successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to drop tables:", error);
    process.exit(1);
  }
}

reset();
