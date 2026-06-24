import { NextResponse } from 'next/server';
import { db } from '@/db';
import { companies, suppliers, stores } from '@/db/schema';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    try {
        if (type === 'companies') {
            const data = await db.select().from(companies);
            return NextResponse.json(data);
        } else if (type === 'suppliers') {
            const data = await db.select().from(suppliers);
            return NextResponse.json(data);
        } else if (type === 'stores') {
            const data = await db.select().from(stores);
            return NextResponse.json(data);
        }
        return NextResponse.json({ message: 'Invalid type' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching masters' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, storeName, companyId, location, status } = body;

        if (type === 'stores') {
            const allIds = await db.select({ id: stores.storeId }).from(stores);
            const nextId = allIds.length > 0 ? Math.max(...allIds.map(r => r.id)) + 1 : 1;

            const [created] = await db.insert(stores).values({
                storeId: nextId,
                storeName,
                companyId: companyId || null,
                location: location || null,
                status: status || 'Active',
            }).returning();

            return NextResponse.json(created);
        }

        return NextResponse.json({ message: 'Invalid type' }, { status: 400 });
    } catch (error) {
        console.error('Error creating master:', error);
        return NextResponse.json({ message: 'Error creating master' }, { status: 500 });
    }
}
