import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chatMessages } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (!id) {
        return NextResponse.json({ message: 'Missing message ID' }, { status: 400 });
    }

    try {
        await db.delete(chatMessages).where(eq(chatMessages.id, id));
        return NextResponse.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error("Error deleting message:", error);
        return NextResponse.json({ message: 'Error deleting message' }, { status: 500 });
    }
}
