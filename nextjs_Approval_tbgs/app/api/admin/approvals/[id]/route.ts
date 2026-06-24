import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dashboardCards } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const cardId = Number(id);
    try {
        const body = await request.json();
        const { cardTitle, permissionColumn, routeSlug, approvalType, iconKey, backgroundColor, parentId, childIds } = body;

        const updateFields: Record<string, any> = {
            cardTitle,
            permissionColumn,
            routeSlug,
            approvalType,
            iconKey,
            backgroundColor,
        };

        if ('parentId' in body) {
            updateFields.parentId = parentId || null;
        }

        await db.update(dashboardCards)
            .set(updateFields)
            .where(eq(dashboardCards.sno, cardId));

        if (Array.isArray(childIds)) {
            if (childIds.includes(cardId)) {
                return NextResponse.json(
                    { message: 'A card cannot be a sub-approval of itself' },
                    { status: 400 }
                );
            }

            const existingChildren = await db.select({ sno: dashboardCards.sno })
                .from(dashboardCards)
                .where(eq(dashboardCards.parentId, cardId));
            const existingChildIds = existingChildren.map(c => c.sno);

            let current = cardId;
            while (current) {
                const rows = await db.select({ sno: dashboardCards.sno, parentId: dashboardCards.parentId })
                    .from(dashboardCards)
                    .where(eq(dashboardCards.sno, current))
                    .limit(1);
                if (rows.length === 0 || rows[0].parentId === null) break;
                const ancestorId = rows[0].parentId;
                if (childIds.includes(ancestorId)) {
                    const ancestor = await db.select({ cardTitle: dashboardCards.cardTitle })
                        .from(dashboardCards)
                        .where(eq(dashboardCards.sno, ancestorId))
                        .limit(1);
                    return NextResponse.json(
                        { message: `Circular reference: "${ancestor[0]?.cardTitle}" is already an ancestor of this card.` },
                        { status: 400 }
                    );
                }
                current = ancestorId;
            }

            const toRemove = existingChildIds.filter(id => !childIds.includes(id));
            for (const removeId of toRemove) {
                await db.update(dashboardCards)
                    .set({ parentId: null })
                    .where(eq(dashboardCards.sno, removeId));
            }

            const toAdd = childIds.filter((id: number) => !existingChildIds.includes(id));
            for (const addId of toAdd) {
                await db.update(dashboardCards)
                    .set({ parentId: cardId })
                    .where(eq(dashboardCards.sno, addId));
            }
        }

        const updatedCard = await db.select()
            .from(dashboardCards)
            .where(eq(dashboardCards.sno, cardId))
            .limit(1);

        return NextResponse.json(updatedCard[0] || null);
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
