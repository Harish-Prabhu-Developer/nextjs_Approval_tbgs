import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dashboardCards } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const { cardTitle, permissionColumn, routeSlug, approvalType, iconKey, backgroundColor, parentId } = body;

        const updatedCard = await db.update(dashboardCards)
            .set({
                cardTitle,
                permissionColumn,
                routeSlug,
                approvalType,
                iconKey,
                backgroundColor,
                parentId: parentId || null,
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
        const cardId = Number(id);

        const children = await db.select({ sno: dashboardCards.sno })
            .from(dashboardCards)
            .where(eq(dashboardCards.parentId, cardId));

        if (children.length > 0) {
            return NextResponse.json({
                message: `Cannot delete: ${children.length} sub-approval(s) are linked to this card. Remove or reassign them first.`
            }, { status: 409 });
        }

        await db.delete(dashboardCards).where(eq(dashboardCards.sno, cardId));
        return NextResponse.json({ message: 'Dashboard card deleted' });
    } catch (error) {
        console.error('Error deleting dashboard card:', error);
        return NextResponse.json({ message: 'Error deleting dashboard card' }, { status: 500 });
    }
}
