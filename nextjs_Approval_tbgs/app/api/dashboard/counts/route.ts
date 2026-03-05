import { NextResponse } from 'next/server';
import { db } from '@/db';
import { approvalRequests, purchaseOrderHdr } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { MOCK_COUNTS } from '@/app/config/mockData';

export async function GET() {
    try {
        // Query PO counts
        const poCountResult = await db.select({
            count: sql<number>`count(*)`
        })
        .from(purchaseOrderHdr)
        .where(sql`status_entry = 'PENDING'`);
        
        // Query other approval counts
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

        // Initialize missing types from mock keys to 0
        Object.keys(MOCK_COUNTS).forEach(key => {
            if (!(key in counts)) {
                counts[key] = 0;
            }
        });

        return NextResponse.json(counts);
    } catch (error) {
        console.error('Error fetching dashboard counts:', error);
        // Fallback to mock data for now
        return NextResponse.json(MOCK_COUNTS);
    }
}
