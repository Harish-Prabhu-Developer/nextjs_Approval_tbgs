import { NextResponse } from 'next/server';
import { db } from '@/db';
import { approvalRequests, approvalDetails, dashboardCards, users } from '@/db/schema';
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
            requestedBy,
            productLineItems,
            truckId,
            trailerId
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
                finalResponseStatus: statusEntry,
                totalFinalProductionHdrAmount: totalAmount,
                modifiedDate: new Date(),
            })
            .where(eq(approvalRequests.sno, Number(id)))
            .returning();

        const updatedDoc = updatedRequest[0];

        // Update product line items: delete old, insert new
        if (updatedDoc && poRefNo) {
            await db.delete(approvalDetails).where(eq(approvalDetails.refNo, poRefNo));
            if (Array.isArray(productLineItems) && productLineItems.length > 0) {
                const detailItems = productLineItems
                    .filter((li: any) => li.productId)
                    .map((li: any) => ({
                        sno: Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000) + Math.floor(Math.random() * 100),
                        refNo: poRefNo,
                        productId: Number(li.productId),
                        productName: li.productName || null,
                        specification: li.specification || null,
                        orderedQty: li.orderedQty || null,
                        unitPrice: li.unitPrice || null,
                        amount: li.amount || null,
                        remarks: li.remarks || null,
                    }));
                if (detailItems.length > 0) {
                    await db.insert(approvalDetails).values(detailItems);
                }
            }
        }

        if (!updatedDoc) {
            return NextResponse.json({ message: 'Approval request not found' }, { status: 404 });
        }

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
