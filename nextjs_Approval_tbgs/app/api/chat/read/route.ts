import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chatMessages } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request) {
    try {
        const { senderId, receiverId } = await req.json();

        if (!senderId || !receiverId) {
            return NextResponse.json({ message: 'Missing IDs' }, { status: 400 });
        }

        // Mark all messages from senderId to receiverId as read
        await db.update(chatMessages)
            .set({ isRead: true })
            .where(
                and(
                    eq(chatMessages.senderId, Number(senderId)),
                    eq(chatMessages.receiverId, Number(receiverId)),
                    eq(chatMessages.isRead, false)
                )
            );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error marking messages as read:", error);
        return NextResponse.json({ message: 'Error marking messages as read' }, { status: 500 });
    }
}
