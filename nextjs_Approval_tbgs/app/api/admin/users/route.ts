import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const allUsers = await db.select().from(users).orderBy(users.name);
        return NextResponse.json(allUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password, name, role, email, permissions } = body;

        // In a real app, hash the password
        const newUser = await db.insert(users).values({
            id: body.id || Math.floor(Math.random() * 1000000), // Auto-generate if not provided
            username,
            password,
            name,
            role: role || 'user',
            email,
            permissions: permissions || [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        return NextResponse.json(newUser[0]);
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
    }
}
