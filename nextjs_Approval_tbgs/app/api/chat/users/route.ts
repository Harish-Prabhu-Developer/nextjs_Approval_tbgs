import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userStatus, chatMessages } from '@/db/schema';
import { eq, or, and, count, desc, sql } from 'drizzle-orm';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const currentUserIdStr = searchParams.get('currentUserId');
        const currentUserId = currentUserIdStr ? Number(currentUserIdStr) : null;

        if (!currentUserId) {
            return NextResponse.json({ message: 'Current User ID is required' }, { status: 400 });
        }

        // 1. Fetch all users except current one
        const allUsers = await db.select().from(users).where(sql`${users.id} != ${currentUserId}`);
        
        // 2. Fetch all statuses
        const statuses = await db.select().from(userStatus);

        // 3. To avoid N+1 query problem, fetch last messages and unread counts in bulk
        // For a small/medium number of users, we'll process with separate queries to keep it simple and readable
        // but avoid doing it inside a loop that calls the database for every user.
        
        // Let's get all last messages for the current user in one go
        // We'll use a subquery approach to get the latest message for each conversation
        const lastMessages = await db.select()
            .from(chatMessages)
            .where(
                or(
                    eq(chatMessages.senderId, currentUserId),
                    eq(chatMessages.receiverId, currentUserId)
                )
            )
            .orderBy(desc(chatMessages.createdAt));

        // Get unread counts for all users sending to current user
        const unreadCounts = await db.select({
            senderId: chatMessages.senderId,
            unreadCount: count()
        })
        .from(chatMessages)
        .where(
            and(
                eq(chatMessages.receiverId, currentUserId),
                eq(chatMessages.isRead, false)
            )
        )
        .groupBy(chatMessages.senderId);

        const usersWithMetadata = allUsers.map((u) => {
            // Find last message with this user
            const lastMsg = lastMessages.find(m => 
                (m.senderId === currentUserId && m.receiverId === u.id) || 
                (m.senderId === u.id && m.receiverId === currentUserId)
            );

            // Find unread count for this user
            const unread = unreadCounts.find(c => c.senderId === u.id);

            return {
                ...u,
                lastMessage: lastMsg?.message || null,
                lastMessageTime: lastMsg?.createdAt || null,
                lastFileUrl: lastMsg?.fileUrl || null,
                lastFileType: lastMsg?.fileType || null,
                unreadCount: Number(unread?.unreadCount || 0),
                status: statuses.find(s => s.userId === u.id) || { 
                    isOnline: false, 
                    lastSeen: u.updatedAt || u.createdAt || new Date().toISOString()
                }
            };
        });

        // Sort by last message time
        const results = usersWithMetadata.sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
        });

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error fetching chat users:", error);
        return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
    }
}
