const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await client.connect();
    
    // List tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("=== TABLES ===");
    res.rows.forEach(r => console.log(r.table_name));
    
    // Check dashboardCards
    try {
      const cards = await client.query('SELECT * FROM tbl_dashboard_cards');
      console.log("\n=== tbl_dashboard_cards ===");
      console.log(cards.rows);
    } catch(e) {
      console.log("tbl_dashboard_cards doesn't exist or error:", e.message);
    }

    // Check users
    try {
      const users = await client.query('SELECT * FROM tbl_users');
      console.log("\n=== tbl_users ===");
      console.log(users.rows);
    } catch(e) {
      console.log("tbl_users doesn't exist or error:", e.message);
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
