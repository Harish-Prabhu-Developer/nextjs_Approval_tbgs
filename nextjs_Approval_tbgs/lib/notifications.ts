import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const expo = new Expo();

export const sendPushNotification = async (userId: number, title: string, body: string, data?: any) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        
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
