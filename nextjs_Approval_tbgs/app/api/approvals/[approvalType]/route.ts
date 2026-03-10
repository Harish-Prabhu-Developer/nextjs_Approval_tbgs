import { NextResponse } from 'next/server';
import { db } from '@/db';
import { approvalRequests, purchaseOrderHdr, dashboardCards } from '@/db/schema';
import { eq, inArray, ilike, or } from 'drizzle-orm';
import { MOCK_APPROVAL_DATA } from '@/app/config/mockData';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ approvalType: string }> }
) {
    const { approvalType } = await params;
    const nType = approvalType.toLowerCase();

    try {
        let dbData: any[] = [];

        // 1. Resolve the URL parameter (routeSlug) to the correct internal approvalType
        let targetApprovalType = approvalType;
        const cardMatch = await db.select().from(dashboardCards).where(
            or(
                ilike(dashboardCards.routeSlug, approvalType),
                ilike(dashboardCards.approvalType, approvalType)
            )
        ).limit(1);

        if (cardMatch.length > 0) {
            targetApprovalType = cardMatch[0].approvalType;
        }

        if (nType === 'purchase-order' || targetApprovalType.toLowerCase() === 'purchase-order') {
            dbData = await db.select().from(purchaseOrderHdr);
        } else {
            dbData = await db.select()
                .from(approvalRequests)
                .where(
                    or(
                        ilike(approvalRequests.approvalType, approvalType),
                        ilike(approvalRequests.approvalType, targetApprovalType)
                    )
                );
        }

        // Get mock data for this type
        const mockData: any[] = MOCK_APPROVAL_DATA[nType] || MOCK_APPROVAL_DATA[targetApprovalType.toLowerCase()] || [];

        // Merge: DB records first, then mock records that don't conflict by poRefNo
        // This ensures admin-created DB records always show up alongside mock data
        const dbPoRefNos = new Set(dbData.map((r: any) => r.poRefNo));
        const uniqueMockData = mockData.filter((m: any) => !dbPoRefNos.has(m.poRefNo));

        const mergedData = [...dbData, ...uniqueMockData];

        // Sort by createdDate descending (newest first)
        mergedData.sort((a, b) => {
            const dateA = new Date(a.createdDate || a.poDate || 0).getTime();
            const dateB = new Date(b.createdDate || b.poDate || 0).getTime();
            return dateB - dateA;
        });

        return NextResponse.json(mergedData);
    } catch (error) {
        console.error('Error fetching approvals:', error);
        // On error, still return mock data as safe fallback
        return NextResponse.json(MOCK_APPROVAL_DATA[nType] || []);
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ approvalType: string }> }
) {
    const { approvalType } = await params;
    const nType = approvalType.toLowerCase();

    try {
        const body = await request.json();
        const { ids, status, remarks } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ message: 'No IDs provided' }, { status: 400 });
        }

        const table = nType === 'purchase-order' ? purchaseOrderHdr : approvalRequests;
        
        const updateData: any = {
            finalResponseStatus: status,
            finalResponseRemarks: remarks,
            finalResponseDate: new Date(),
            modifiedDate: new Date()
        };

        const result = await db.update(table)
            .set(updateData)
            .where(inArray(table.sno, ids))
            .returning();

        return NextResponse.json({ 
            message: `Successfully updated ${result.length} records`,
            updatedCount: result.length
        });

    } catch (error) {
        console.error('Error updating approvals:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
