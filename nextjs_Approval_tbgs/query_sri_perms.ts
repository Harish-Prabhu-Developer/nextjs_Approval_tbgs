import 'dotenv/config';
import { db } from './db';
import { users, dashboardCards } from './db/schema';
import { ilike, or } from 'drizzle-orm';

async function main() {
    const userResults = await db.select().from(users).where(
        or(ilike(users.name, '%sri%'), ilike(users.username, '%sri%'))
    );
    const u = userResults[0];
    console.log('=== SRI USER ===');
    console.log(JSON.stringify({
        id: u.id, username: u.username, name: u.name,
        role: u.role, permissions: u.permissions
    }, null, 2));

    const cards = await db.select().from(dashboardCards).orderBy(dashboardCards.sno);
    console.log('\n=== DASHBOARD CARDS ===');
    cards.forEach(c => {
        const hasPerm = u.role === 'admin'
            || (Array.isArray(u.permissions) && u.permissions.includes(c.permissionColumn));
        console.log(`${c.sno}. ${c.cardTitle} -> permission: "${c.permissionColumn}" -> route: /${c.routeSlug} ${hasPerm ? 'YES' : 'NO'}`);
    });

    console.log(`\nTotal cards: ${cards.length}`);
    console.log(`Sri's role: ${u.role} -> Admin access: ALL cards YES`);
    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
