import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dashboardCards } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        const cards = await db.select({
            sno: dashboardCards.sno,
            cardTitle: dashboardCards.cardTitle,
            permissionColumn: dashboardCards.permissionColumn,
            routeSlug: dashboardCards.routeSlug,
            approvalType: dashboardCards.approvalType,
            iconKey: dashboardCards.iconKey,
            backgroundColor: dashboardCards.backgroundColor,
            parentId: dashboardCards.parentId,
            childCount: sql<number>`coalesce((
                SELECT COUNT(*) FROM tbl_dashboard_cards AS child
                WHERE child.parent_id = tbl_dashboard_cards.sno
            ), 0)`,
            pendingCount: sql<number>`coalesce((
                SELECT COUNT(*)::int FROM tbl_approval_requests
                WHERE approval_type = tbl_dashboard_cards.approval_type
                AND (final_response_status = 'PENDING' OR final_response_status IS NULL)
            ), 0)`,
        })
        .from(dashboardCards)
        .orderBy(dashboardCards.sno);

        return NextResponse.json(cards);
    } catch (error) {
        console.error('Error fetching dashboard cards:', error);
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
