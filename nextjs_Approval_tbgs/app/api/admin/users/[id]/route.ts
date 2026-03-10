import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const { username, password, name, role, email, permissions, isActive } = body;

        const updatedUser = await db.update(users)
            .set({
                username,
                password, // Should be hashed
                name,
                role,
                email,
                permissions,
                isActive,
                updatedAt: new Date(),
            })
            .where(eq(users.id, Number(id)))
            .returning();

        return NextResponse.json(updatedUser[0]);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ message: 'Error updating user' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await db.delete(users).where(eq(users.id, Number(id)));
        return NextResponse.json({ message: 'User deleted' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ message: 'Error deleting user' }, { status: 500 });
    }
}
