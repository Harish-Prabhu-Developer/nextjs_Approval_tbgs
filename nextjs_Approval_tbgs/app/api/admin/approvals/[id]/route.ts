import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dashboardCards } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const { cardTitle, permissionColumn, routeSlug, approvalType, iconKey, backgroundColor } = body;

        const updatedCard = await db.update(dashboardCards)
            .set({
                cardTitle,
                permissionColumn,
                routeSlug,
                approvalType,
                iconKey,
                backgroundColor,
            })
            .where(eq(dashboardCards.sno, Number(id)))
            .returning();

        return NextResponse.json(updatedCard[0]);
    } catch (error) {
        console.error('Error updating dashboard card:', error);
        return NextResponse.json({ message: 'Error updating dashboard card' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await db.delete(dashboardCards).where(eq(dashboardCards.sno, Number(id)));
        return NextResponse.json({ message: 'Dashboard card deleted' });
    } catch (error) {
        console.error('Error deleting dashboard card:', error);
        return NextResponse.json({ message: 'Error deleting dashboard card' }, { status: 500 });
    }
}
