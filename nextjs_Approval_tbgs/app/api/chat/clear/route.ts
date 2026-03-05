import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chatMessages } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';

export async function POST(req: Request) {
    try {
        const { userId, targetId } = await req.json();

        if (!userId || !targetId) {
            return NextResponse.json({ message: 'Missing user IDs' }, { status: 400 });
        }

        const uId = Number(userId);
        const tId = Number(targetId);

        // Delete all messages between these two users
        await db.delete(chatMessages).where(
            or(
                and(eq(chatMessages.senderId, uId), eq(chatMessages.receiverId, tId)),
                and(eq(chatMessages.senderId, tId), eq(chatMessages.receiverId, uId))
            )
        );

        return NextResponse.json({ message: 'Chat cleared successfully' });
    } catch (error) {
        console.error("Error clearing chat:", error);
        return NextResponse.json({ message: 'Error clearing chat' }, { status: 500 });
    }
}
