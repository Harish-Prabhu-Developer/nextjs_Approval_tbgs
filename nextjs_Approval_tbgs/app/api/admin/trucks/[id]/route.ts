import { NextResponse } from 'next/server';
import { db } from '@/db';
import { trucks } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const updated = await db.update(trucks)
            .set(body)
            .where(eq(trucks.truckId, Number(id)))
            .returning();
        
        return NextResponse.json(updated[0]);
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await db.delete(trucks).where(eq(trucks.truckId, Number(id)));
        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
