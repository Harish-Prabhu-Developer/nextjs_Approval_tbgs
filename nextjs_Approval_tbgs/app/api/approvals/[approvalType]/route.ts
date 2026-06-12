import { NextResponse } from 'next/server';
import { db } from '@/db';
import { approvalRequests, dashboardCards, companies } from '@/db/schema';
import { eq, inArray, ilike, or } from 'drizzle-orm';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ approvalType: string }> }
) {
    const { approvalType } = await params;

    try {
        const companiesList = await db.select().from(companies);
        const companyMap = new Map(companiesList.map(c => [c.companyId, c.companyName]));

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

        const dbData = (await db.select()
            .from(approvalRequests)
            .where(
                or(
                    ilike(approvalRequests.approvalType, approvalType),
                    ilike(approvalRequests.approvalType, targetApprovalType)
                )
            )).map(r => ({
                ...r,
                companyName: r.companyId != null ? companyMap.get(r.companyId) || null : null
            }));

        dbData.sort((a, b) => {
            const dateA = new Date(a.createdDate || a.poDate || 0).getTime();
            const dateB = new Date(b.createdDate || b.poDate || 0).getTime();
            return dateB - dateA;
        });

        return NextResponse.json(dbData);
    } catch (error) {
        console.error('Error fetching approvals:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ approvalType: string }> }
) {
    const { approvalType } = await params;

    try {
        const body = await request.json();
        const { ids, status, remarks } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ message: 'No IDs provided' }, { status: 400 });
        }

        const updateData: any = {
            finalResponseStatus: status,
            finalResponseRemarks: remarks,
            finalResponseDate: new Date(),
            modifiedDate: new Date()
        };

        const result = await db.update(approvalRequests)
            .set(updateData)
            .where(inArray(approvalRequests.sno, ids))
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
