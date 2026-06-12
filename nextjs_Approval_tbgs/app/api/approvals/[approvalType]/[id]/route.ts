import { NextResponse } from 'next/server';
import { db } from '@/db';
import { approvalRequests } from '@/db/schema';
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

        return NextResponse.json(record);
    } catch (error) {
        console.error('Error fetching approval detail:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
