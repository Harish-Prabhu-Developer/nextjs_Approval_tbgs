import { NextResponse } from 'next/server';
import { db } from '@/db';
import { trailers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const updated = await db.update(trailers)
            .set(body)
            .where(eq(trailers.trailerId, Number(id)))
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
        await db.delete(trailers).where(eq(trailers.trailerId, Number(id)));
        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
