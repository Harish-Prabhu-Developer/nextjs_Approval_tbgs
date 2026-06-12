import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
    try {
        const { username, password, fcmToken } = await request.json();

        // In a real app, you'd verify against DB
        let user = null;

        const dbUsers = await db.select().from(users).where(eq(users.username, username));
        if (dbUsers.length > 0 && dbUsers[0].password === password) {
            user = dbUsers[0];
            
            // Update FCM token if provided
            if (fcmToken) {
                await db.update(users)
                    .set({ fcmToken })
                    .where(eq(users.id, user.id));
                user.fcmToken = fcmToken;
            }
        }

        if (!user) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        return NextResponse.json({
            user,
            token
        });
    } catch (error) {
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
