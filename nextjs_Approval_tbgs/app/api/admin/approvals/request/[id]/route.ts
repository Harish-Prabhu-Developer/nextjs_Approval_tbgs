import { NextResponse } from 'next/server';
import { db } from '@/db';
import { approvalRequests, dashboardCards, users } from '@/db/schema';
import { eq, arrayContains } from 'drizzle-orm';
import { sendPushNotification } from '@/lib/notifications';

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

        const updatedDoc = updatedRequest[0];

        // Send Push Notifications for Update
        void (async () => {
            try {
                const [card] = await db.select()
                    .from(dashboardCards)
                    .where(eq(dashboardCards.approvalType, approvalType));

                if (card) {
                    const permissionNeeded = card.permissionColumn;
                    const approvers = await db.select()
                        .from(users)
                        .where(arrayContains(users.permissions, [permissionNeeded]));

                    for (const approver of approvers) {
                        await sendPushNotification(
                            approver.id,
                            `${card.cardTitle} Updated`,
                            `Ref: ${poRefNo} has been modified by ${requestedBy || 'admin'}.`,
                            { 
                                type: 'approval_update', 
                                sno: updatedDoc.sno,
                                approvalType: approvalType
                            }
                        );
                    }
                }
            } catch (err) {
                console.error("Failed to send push notifications for update:", err);
            }
        })();

        return NextResponse.json(updatedDoc);
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
        // Fetch details before deleting to send notification
        const [existingRequest] = await db.select().from(approvalRequests).where(eq(approvalRequests.sno, Number(id)));
        
        await db.delete(approvalRequests).where(eq(approvalRequests.sno, Number(id)));

        // Send Push Notifications for Delete
        if (existingRequest) {
            void (async () => {
                try {
                    const [card] = await db.select()
                        .from(dashboardCards)
                        .where(eq(dashboardCards.approvalType, existingRequest.approvalType));

                    if (card) {
                        const permissionNeeded = card.permissionColumn;
                        const approvers = await db.select()
                            .from(users)
                            .where(arrayContains(users.permissions, [permissionNeeded]));

                        for (const approver of approvers) {
                            await sendPushNotification(
                                approver.id,
                                `${card.cardTitle} Removed`,
                                `Ref: ${existingRequest.poRefNo} has been deleted.`,
                                { 
                                    type: 'approval_delete', 
                                    sno: existingRequest.sno,
                                    approvalType: existingRequest.approvalType
                                }
                            );
                        }
                    }
                } catch (err) {
                    console.error("Failed to send push notifications for delete:", err);
                }
            })();
        }

        return NextResponse.json({ message: 'Approval request deleted' });
    } catch (error) {
        console.error('Error deleting approval request:', error);
        return NextResponse.json({ message: 'Error deleting approval request' }, { status: 500 });
    }
}
