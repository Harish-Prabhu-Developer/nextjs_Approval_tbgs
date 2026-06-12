import { NextResponse } from 'next/server';
import { db } from '@/db';
import { approvalRequests, approvalDetails, purchaseOrderHdr, dashboardCards, users, companies } from '@/db/schema';
import { eq, inArray, arrayContains } from 'drizzle-orm';
import { sendPushNotification } from '@/lib/notifications';

export async function GET() {
    try {
        const companiesList = await db.select().from(companies);
        const companyMap = new Map(companiesList.map(c => [c.companyId, c.companyName]));

        const dbRequests = await db.select().from(approvalRequests);
        const poRequests = await db.select().from(purchaseOrderHdr);

        const typedPoRequests = poRequests.map(po => ({
             ...po,
             approvalType: 'purchase-order',
             statusEntry: po.finalResponseStatus || po.statusEntry || 'PENDING'
        }));

        const typedDbRequests = dbRequests.map(r => ({
             ...r,
             companyName: r.companyId != null ? companyMap.get(r.companyId) || null : null
        }));

        const allRequests = [...typedDbRequests, ...typedPoRequests].sort((a, b) => {
            const dateA = new Date(a.createdDate || a.poDate || 0).getTime();
            const dateB = new Date(b.createdDate || b.poDate || 0).getTime();
            return dateB - dateA;
        });

        return NextResponse.json(allRequests);
    } catch (error) {
        console.error('Error fetching approval requests:', error);
        return NextResponse.json({ message: 'Error fetching approval requests' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            approvalType,
            poRefNo,
            companyId,
            supplierId,
            remarks,
            requestedBy,
            totalAmount,
            purchaseType,
            currencyType,
            poStoreId,
            poDate,
            statusEntry,
            productLineItems,
            truckId,
            trailerId
        } = body;

        const sno = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);

        const newRequest = await db.insert(approvalRequests).values({
            sno,
            approvalType,
            poRefNo,
            poDate: poDate ? new Date(poDate) : new Date(),
            purchaseType: purchaseType || 'LOCAL',
            companyId: companyId ? Number(companyId) : null,
            supplierId: supplierId ? Number(supplierId) : null,
            poStoreId: poStoreId ? Number(poStoreId) : null,
            remarks,
            currencyType: currencyType || 'USD',
            statusEntry: statusEntry || 'PENDING',
            finalResponseStatus: statusEntry || 'PENDING',
            totalFinalProductionHdrAmount: totalAmount || 0,
            requestedBy: requestedBy || 'admin',
            requestedDate: new Date(),
            createdDate: new Date(),
        }).returning();

        // Save product line items
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

        const createdRequest = newRequest[0];

        // Send Push Notifications to relevant approvers
        void (async () => {
            try {
                // 1. Find the card to get the permission required
                const [card] = await db.select()
                    .from(dashboardCards)
                    .where(eq(dashboardCards.approvalType, approvalType));

                if (card) {
                    const permissionNeeded = card.permissionColumn;
                    
                    // 2. Find all users who have this permission
                    const approvers = await db.select()
                        .from(users)
                        .where(arrayContains(users.permissions, [permissionNeeded]));

                    // 3. Send notification to each approver
                    for (const approver of approvers) {
                        await sendPushNotification(
                            approver.id,
                            `New ${card.cardTitle} Request`,
                            `Ref: ${poRefNo} has been dispatched by ${requestedBy || 'admin'}.`,
                            { 
                                type: 'approval_request', 
                                sno: createdRequest.sno,
                                approvalType: approvalType
                            }
                        );
                    }
                }
            } catch (err) {
                console.error("Failed to send push notifications for approval:", err);
            }
        })();

        return NextResponse.json(createdRequest);
    } catch (error) {
        console.error('Error requesting approval:', error);
        return NextResponse.json({ message: 'Error requesting approval' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
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

        // Also update purchase_order_hdr if any of the IDs match
        await db.update(purchaseOrderHdr)
            .set(updateData)
            .where(inArray(purchaseOrderHdr.sno, ids));

        return NextResponse.json({
            message: `Successfully updated ${result.length} records`,
            updatedCount: result.length
        });
    } catch (error) {
        console.error('Error updating approvals:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
