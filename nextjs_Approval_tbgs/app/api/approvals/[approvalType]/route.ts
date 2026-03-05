import { NextResponse } from 'next/server';
import { db } from '@/db';
import { approvalRequests, purchaseOrderHdr } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { MOCK_APPROVAL_DATA } from '@/app/config/mockData';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ approvalType: string }> }
) {
    const { approvalType } = await params;
    const nType = approvalType.toLowerCase();

    try {
        let data;

        if (nType === 'purchase-order') {
            data = await db.select().from(purchaseOrderHdr);
        } else {
            data = await db.select()
                .from(approvalRequests)
                .where(eq(approvalRequests.approvalType, nType));
        }

        // Fallback to mock data if DB is empty (useful for dev/test)
        if (!data || data.length === 0) {
            data = MOCK_APPROVAL_DATA[nType] || [];
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching approvals:', error);
        // On error, still return mock data as safe fallback during transition
        return NextResponse.json(MOCK_APPROVAL_DATA[nType] || []);
    }
}
