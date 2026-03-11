import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, or, and, asc } from 'drizzle-orm';
import { users, chatMessages } from '@/db/schema';
import { sendPushNotification } from '@/lib/notifications';

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
        const { senderId, receiverId, message, imageUrl, fileUrl, fileName, fileType, replyTo } = body;

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
            isRead: false,
            replyTo
        }).returning();

        const createdMessage = newMessage[0];

        // Send Push Notification asynchronoulsy (WhatsApp style)
        void (async () => {
            try {
                const [sender] = await db.select().from(users).where(eq(users.id, senderId));
                if (sender) {
                    await sendPushNotification(
                        receiverId,
                        sender.name, // Title is Sender Name
                        message || (fileUrl ? 'Sent a file' : 'New message'), // Body is message
                        { 
                            type: 'chat_message', 
                            messageId: createdMessage.id,
                            senderId: senderId,
                            senderName: sender.name
                        }
                    );
                }
            } catch (err) {
                console.error("Failed to send push notification for chat:", err);
            }
        })();

        return NextResponse.json(createdMessage);
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json({ message: 'Error sending message' }, { status: 500 });
    }
}
