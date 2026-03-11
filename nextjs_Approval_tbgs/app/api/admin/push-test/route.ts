import { NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/notifications';

export async function POST(request: Request) {
    try {
        const { userId, title, body, data } = await request.json();

        if (!userId) {
            return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
        }

        const tickets = await sendPushNotification(
            userId, 
            title || 'Test Notification', 
            body || 'This is a test notification from the server', 
            data || { type: 'test' }
        );

        return NextResponse.json({ 
            message: 'Push notification request processed',
            tickets 
        });
    } catch (error: any) {
        console.error('Push test error:', error);
        return NextResponse.json({ message: error.message || 'Error sending notification' }, { status: 500 });
    }
}
