import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dashboardCards } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
    try {
        // Only return top-level cards (parentId IS NULL)
        const cards = await db.select({
            sno: dashboardCards.sno,
            cardTitle: dashboardCards.cardTitle,
            permissionColumn: dashboardCards.permissionColumn,
            routeSlug: dashboardCards.routeSlug,
            approvalType: dashboardCards.approvalType,
            iconKey: dashboardCards.iconKey,
            backgroundColor: dashboardCards.backgroundColor,
            parentId: dashboardCards.parentId,
            childCount: sql<number>`(
                SELECT COUNT(*) FROM ${dashboardCards} AS child
                WHERE child.parent_id = ${dashboardCards.sno}
            )`,
        })
        .from(dashboardCards)
        .where(sql`parent_id IS NULL`)
        .orderBy(dashboardCards.sno);

        return NextResponse.json(cards);
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
