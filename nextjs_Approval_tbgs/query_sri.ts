import 'dotenv/config';
import { db } from './db';
import { users } from './db/schema';
import { ilike, or } from 'drizzle-orm';

async function queryUser() {
    try {
        const results = await db.select().from(users).where(
            or(
                ilike(users.name, '%sri%'),
                ilike(users.username, '%sri%')
            )
        );
        
        console.log('\n--- User Records for "sri" ---');
            results.forEach(u => {
                console.log(`\nID: ${u.id}`);
                console.log(`Username: ${u.username}`);
                console.log(`Name: ${u.name}`);
                console.log(`Email: ${u.email}`);
                console.log(`Role: ${u.role}`);
                console.log(`Active: ${u.isActive}`);
                console.log(`FCM Token: ${u.fcmToken ? u.fcmToken.substring(0, 20) + '...' : 'Not Set'}`);
            });
        console.log('------------------------------\n');
        process.exit(0);
    } catch (error) {
        console.error('Error querying user:', error);
        process.exit(1);
    }
}

queryUser();
