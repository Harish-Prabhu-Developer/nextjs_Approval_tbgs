// import { db } from './index';
// import { sql } from 'drizzle-orm';

// async function reset() {
//   console.log('🗑️  Dropping all tables in the public schema...');
  
//   try {
//     // This script drops all tables in the public schema of a PostgreSQL database
//     await db.execute(sql`
//       DO $$ DECLARE
//         r RECORD;
//       BEGIN
//         FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
//           EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
//         END LOOP;
//       END $$;
//     `);
    
//     console.log('✅ All tables dropped successfully!');
//   } catch (error) {
//     console.error('❌ Failed to drop tables:', error);
//   } finally {
//     process.exit(0);
//   }
// }

// reset();
