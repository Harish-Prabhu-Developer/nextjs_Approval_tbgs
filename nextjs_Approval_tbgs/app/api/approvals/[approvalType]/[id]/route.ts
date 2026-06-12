import { NextResponse } from 'next/server';
import { db } from '@/db';
import { approvalRequests, approvalDetails, companies, suppliers, stores, purchaseOrderAdditionalCosts, purchaseOrderFiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ approvalType: string, id: string }> }
) {
    const { approvalType, id } = await params;
    const sno = parseInt(id);

    try {
        const results = await db.select()
            .from(approvalRequests)
            .where(and(
                eq(approvalRequests.approvalType, approvalType),
                eq(approvalRequests.sno, sno)
            ))
            .limit(1);

        const record = results[0];

        if (!record) {
            return NextResponse.json({ message: 'Record not found' }, { status: 404 });
        }

        const [company] = record.companyId != null
            ? await db.select().from(companies).where(eq(companies.companyId, record.companyId)).limit(1)
            : [];
        const [supplier] = record.supplierId != null
            ? await db.select().from(suppliers).where(eq(suppliers.supplierId, record.supplierId)).limit(1)
            : [];
        const [store] = record.poStoreId != null
            ? await db.select().from(stores).where(eq(stores.storeId, record.poStoreId)).limit(1)
            : [];

        const lineItems = await db.select()
            .from(approvalDetails)
            .where(eq(approvalDetails.refNo, record.poRefNo));

        const additionalCosts = await db.select()
            .from(purchaseOrderAdditionalCosts)
            .where(eq(purchaseOrderAdditionalCosts.poRefNo, record.poRefNo));

        const files = await db.select()
            .from(purchaseOrderFiles)
            .where(eq(purchaseOrderFiles.poRefNo, record.poRefNo));

        return NextResponse.json({
            ...record,
            company: company || null,
            supplier: supplier || null,
            store: store || null,
            productLineItems: lineItems,
            additionalCosts,
            files
        });
    } catch (error) {
        console.error('Error fetching approval detail:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
