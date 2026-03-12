import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import axios from 'axios';

const expo = new Expo();
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export const sendPushNotification = async (userId: number, title: string, body: string, data?: any) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        
        // 1. Also emit to Socket for real-time web alerts
        try {
            await axios.post(`${SOCKET_URL}/emit`, {
                event: 'push-notification',
                room: `user-${userId}`,
                data: { title, body, ...data }
            }).catch(() => {/* ignore socket failure */});
        } catch (e) {
            // Silently fail socket emission
        }

        if (!user || !user.fcmToken || !Expo.isExpoPushToken(user.fcmToken)) {
            console.warn(`User ${userId} has no valid push token`);
            return;
        }

        const messages: ExpoPushMessage[] = [{
            to: user.fcmToken,
            sound: 'default',
            title,
            body,
            data,
        }];

        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];
        
        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending push notification chunk:', error);
            }
        }
        
        return tickets;
    } catch (error) {
        console.error('Push notification failed:', error);
    }
};
