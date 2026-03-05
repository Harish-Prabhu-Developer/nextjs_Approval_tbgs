import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chatMessages } from '@/db/schema';
import { eq, or, and, asc } from 'drizzle-orm';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId1 = parseInt(searchParams.get('userId1') || '0');
    const userId2 = parseInt(searchParams.get('userId2') || '0');

    if (!userId1 || !userId2) {
        return NextResponse.json({ message: 'Missing user IDs' }, { status: 400 });
    }

    try {
        const messages = await db.select().from(chatMessages).where(
            or(
                and(eq(chatMessages.senderId, userId1), eq(chatMessages.receiverId, userId2)),
                and(eq(chatMessages.senderId, userId2), eq(chatMessages.receiverId, userId1))
            )
        ).orderBy(asc(chatMessages.createdAt));

        return NextResponse.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ message: 'Error fetching messages' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { senderId, receiverId, message, imageUrl, fileUrl, fileName, fileType } = body;

        if (!senderId || !receiverId || (!message && !fileUrl)) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const newMessage = await db.insert(chatMessages).values({
            senderId,
            receiverId,
            message: message || '',
            imageUrl,
            fileUrl,
            fileName,
            fileType,
            isRead: false
        }).returning();

        return NextResponse.json(newMessage[0]);
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json({ message: 'Error sending message' }, { status: 500 });
    }
}
