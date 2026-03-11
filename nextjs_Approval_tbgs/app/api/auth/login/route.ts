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
        // For now, if DB is empty, we can mock a successful login for 'admin'
        
        let user = null;
        try {
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
        } catch (e) {
            console.error("DB Login failed, falling back to mock", e);
        }

        // Fallback mock user if DB fails or is empty
        if (!user && username === 'admin' && password === 'password123') {
            user = {
                id: 1,
                username: 'admin',
                name: 'Administrator',
                role: 'admin',
                email: 'admin@tbgs.co.tz',
                permissions: ["poApproval", "workOrderApproval", "priceApproval", "salesReturnApproval"]
            };
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
