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
