import { NextResponse } from 'next/server';
import { db } from '@/db';
import { approvalRequests } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const {
            approvalType,
            poRefNo,
            companyId,
            supplierId,
            remarks,
            totalAmount,
            statusEntry,
            purchaseType,
            currencyType,
            poStoreId,
            poDate,
            requestedBy
        } = body;

        const updatedRequest = await db.update(approvalRequests)
            .set({
                approvalType,
                poRefNo,
                poDate: poDate ? new Date(poDate) : undefined,
                purchaseType,
                companyId: companyId ? Number(companyId) : null,
                supplierId: supplierId ? Number(supplierId) : null,
                poStoreId: poStoreId ? Number(poStoreId) : null,
                currencyType,
                remarks,
                requestedBy,
                statusEntry,
                // Mirror statusEntry into finalResponseStatus so it shows in the approvals list
                finalResponseStatus: statusEntry,
                totalFinalProductionHdrAmount: totalAmount,
                modifiedDate: new Date(),
            })
            .where(eq(approvalRequests.sno, Number(id)))
            .returning();

        return NextResponse.json(updatedRequest[0]);
    } catch (error) {
        console.error('Error updating approval request:', error);
        return NextResponse.json({ message: 'Error updating approval request' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await db.delete(approvalRequests).where(eq(approvalRequests.sno, Number(id)));
        return NextResponse.json({ message: 'Approval request deleted' });
    } catch (error) {
        console.error('Error deleting approval request:', error);
        return NextResponse.json({ message: 'Error deleting approval request' }, { status: 500 });
    }
}
