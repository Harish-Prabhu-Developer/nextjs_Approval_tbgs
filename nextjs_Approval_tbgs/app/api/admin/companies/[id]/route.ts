import { NextResponse } from 'next/server';
import { db } from '@/db';
import { companies } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const updated = await db.update(companies)
            .set(body)
            .where(eq(companies.companyId, Number(id)))
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
        await db.delete(companies).where(eq(companies.companyId, Number(id)));
        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
