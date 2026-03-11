import { NextResponse } from 'next/server';
import { db } from '@/db';
import { approvalRequests, purchaseOrderHdr, dashboardCards, users } from '@/db/schema';
import { eq, ilike, contains, arrayContains } from 'drizzle-orm';
import { MOCK_APPROVAL_DATA } from '@/app/config/mockData';
import { sendPushNotification } from '@/lib/notifications';

export async function GET() {
    try {
        const dbRequests = await db.select().from(approvalRequests);
        const poRequests = await db.select().from(purchaseOrderHdr);
        
        let allMockData: any[] = [];
        Object.keys(MOCK_APPROVAL_DATA).forEach((key) => {
             const mockArray = MOCK_APPROVAL_DATA[key];
             if (Array.isArray(mockArray)) {
                 // Ensure mock data has the correct approvalType if missing
                 const typedMockArray = mockArray.map(m => ({ ...m, approvalType: m.approvalType || key }));
                 allMockData = [...allMockData, ...typedMockArray];
             }
        });

        // Combine DB PO requests with DB generic requests
        const typedPoRequests = poRequests.map(po => ({
             ...po,
             approvalType: 'purchase-order', // so the table can display it properly
             statusEntry: po.finalResponseStatus || po.statusEntry || 'PENDING'
        }));

        const mergedDbRequests = [...dbRequests, ...typedPoRequests];

        // Ensure we deduplicate mock data that has the same poRefNo as DB data
        const dbPoRefNos = new Set(mergedDbRequests.map((r: any) => r.poRefNo));
        const uniqueMockData = allMockData.filter((m: any) => !dbPoRefNos.has(m.poRefNo));

        const allRequests = [...mergedDbRequests, ...uniqueMockData].sort((a, b) => {
            const dateA = new Date(a.createdDate || a.poDate || 0).getTime();
            const dateB = new Date(b.createdDate || b.poDate || 0).getTime();
            return dateB - dateA; // newest first
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
            statusEntry
        } = body;

        // Use timestamp (seconds) + random to avoid primary key collisions and fit in integer range
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
            // Mirror statusEntry into finalResponseStatus so it appears in the approvals list
            finalResponseStatus: statusEntry || 'PENDING',
            totalFinalProductionHdrAmount: totalAmount || 0,
            requestedBy: requestedBy || 'admin',
            requestedDate: new Date(),
            createdDate: new Date(),
        }).returning();

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
