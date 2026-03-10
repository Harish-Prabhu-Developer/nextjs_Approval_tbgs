import { NextResponse } from 'next/server';
import { db } from '@/db';
import { approvalRequests } from '@/db/schema';

export async function GET() {
    try {
        const allRequests = await db.select().from(approvalRequests).orderBy(approvalRequests.createdDate);
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

        // Use timestamp + random to avoid primary key collisions
        const sno = Date.now() + Math.floor(Math.random() * 1000);

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

        return NextResponse.json(newRequest[0]);
    } catch (error) {
        console.error('Error requesting approval:', error);
        return NextResponse.json({ message: 'Error requesting approval' }, { status: 500 });
    }
}
