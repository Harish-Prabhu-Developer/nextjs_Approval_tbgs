import { NextResponse } from 'next/server';
import { db } from '@/db';
import { approvalRequests, purchaseOrderHdr } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        const poCountResult = await db.select({
            count: sql<number>`count(*)`
        })
        .from(purchaseOrderHdr)
        .where(sql`status_entry = 'PENDING'`);

        const otherCountsResult = await db.select({
            type: approvalRequests.approvalType,
            count: sql<number>`count(*)`
        })
        .from(approvalRequests)
        .where(sql`status_entry = 'PENDING'`)
        .groupBy(approvalRequests.approvalType);

        const counts: Record<string, number> = {
            'purchase-order': Number(poCountResult[0]?.count || 0)
        };

        otherCountsResult.forEach(row => {
            if (row.type) {
                counts[row.type] = Number(row.count);
            }
        });

        return NextResponse.json(counts);
    } catch (error) {
        console.error('Error fetching dashboard counts:', error);
        return NextResponse.json({ message: 'Error fetching counts' }, { status: 500 });
    }
}
