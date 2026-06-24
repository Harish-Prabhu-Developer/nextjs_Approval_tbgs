import { NextResponse } from 'next/server';
import { db } from '@/db';
import { purchaseOrderConversation } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const poRefNo = searchParams.get('poRefNo');
    
    if (!poRefNo) {
        return NextResponse.json({ message: 'poRefNo is required' }, { status: 400 });
    }
    
    try {
        const conversations = await db.select()
            .from(purchaseOrderConversation)
            .where(eq(purchaseOrderConversation.poRefNo, poRefNo))
            .orderBy(purchaseOrderConversation.createdDate);
        
        return NextResponse.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ message: 'Error fetching conversations' }, { status: 500 });
    }
}
