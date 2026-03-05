import { NextResponse } from 'next/server';
import { db } from '@/db';
import { approvalRequests, purchaseOrderHdr } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { MOCK_APPROVAL_DATA } from '@/app/config/mockData';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ approvalType: string, id: string }> }
) {
    const { approvalType, id } = await params;
    const nType = approvalType.toLowerCase();
    const sno = parseInt(id);

    try {
        let record;

        if (nType === 'purchase-order') {
            const results = await db.select().from(purchaseOrderHdr).where(eq(purchaseOrderHdr.sno, sno)).limit(1);
            record = results[0];
        } else {
            const results = await db.select()
                .from(approvalRequests)
                .where(and(
                    eq(approvalRequests.approvalType, nType),
                    eq(approvalRequests.sno, sno)
                ))
                .limit(1);
            record = results[0];
        }

        if (!record) {
            // Fallback to mock data
            const list = MOCK_APPROVAL_DATA[nType] || [];
            record = list.find((item: any) => item.sno.toString() === id);
        }

        if (!record) {
            return NextResponse.json({ message: 'Record not found' }, { status: 404 });
        }

        return NextResponse.json(record);
    } catch (error) {
        console.error('Error fetching approval detail:', error);
        // Fallback on error
        const list = MOCK_APPROVAL_DATA[nType] || [];
        const record = list.find((item: any) => item.sno.toString() === id);
        if (!record) return NextResponse.json({ message: 'Error fetching record' }, { status: 500 });
        return NextResponse.json(record);
    }
}
