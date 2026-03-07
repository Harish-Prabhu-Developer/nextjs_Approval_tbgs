import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userStatus, chatMessages } from '@/db/schema';
import { eq, or, and, count, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const currentUserIdStr = searchParams.get('currentUserId');
        const currentUserId = currentUserIdStr ? Number(currentUserIdStr) : null;

        if (!currentUserId) {
            return NextResponse.json({ message: 'Current User ID is required' }, { status: 400 });
        }

        // 1. Fetch other users with status join
        const otherUsers = await db.select({
            id: users.id,
            name: users.name,
            username: users.username,
            email: users.email,
            updatedAt: users.updatedAt,
            createdAt: users.createdAt,
            status: {
                isOnline: userStatus.isOnline,
                lastSeen: userStatus.lastSeen
            }
        })
        .from(users)
        .leftJoin(userStatus, eq(users.id, userStatus.userId))
        .where(sql`${users.id} != ${currentUserId}`);

        if (otherUsers.length === 0) return NextResponse.json([]);

        // 2. Fetch unread counts
        const unreadCountsResults = await db.select({
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

        // 3. Fetch latest message per conversation
        const conversations = await db.select()
            .from(chatMessages)
            .where(
                or(
                    eq(chatMessages.senderId, currentUserId),
                    eq(chatMessages.receiverId, currentUserId)
                )
            )
            .orderBy(desc(chatMessages.createdAt));

        const latestMsgMap = new Map();
        conversations.forEach(m => {
            const otherId = m.senderId === currentUserId ? m.receiverId : m.senderId;
            if (!latestMsgMap.has(otherId)) {
                latestMsgMap.set(otherId, m);
            }
        });

        // 4. Map results
        const results = otherUsers.map((u) => {
            const lastMsg = latestMsgMap.get(u.id);
            const unread = unreadCountsResults.find(c => c.senderId === u.id);

            return {
                ...u,
                lastMessage: lastMsg?.message || null,
                lastMessageTime: lastMsg?.createdAt || null,
                lastFileUrl: lastMsg?.fileUrl || null,
                lastFileType: lastMsg?.fileType || null,
                unreadCount: Number(unread?.unreadCount || 0),
                status: u.status || { 
                    isOnline: false, 
                    lastSeen: u.updatedAt || u.createdAt || new Date().toISOString()
                }
            };
        });

        results.sort((a, b) => {
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
