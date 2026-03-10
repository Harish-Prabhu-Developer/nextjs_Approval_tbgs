import { NextResponse } from 'next/server';
import { db } from '@/db';
import { suppliers } from '@/db/schema';

export async function GET() {
    try {
        const data = await db.select().from(suppliers);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const sno = Math.floor(Math.random() * 1000000);
        
        const newData = await db.insert(suppliers).values({
            ...body,
            supplierId: body.supplierId || sno
        }).returning();

        return NextResponse.json(newData[0]);
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
