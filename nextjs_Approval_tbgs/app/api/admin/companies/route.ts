import { NextResponse } from 'next/server';
import { db } from '@/db';
import { companies } from '@/db/schema';

export async function GET() {
    try {
        const data = await db.select().from(companies);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Simple ID generation for demo, usually serial or uuid
        const sno = Math.floor(Math.random() * 1000000);
        
        const newData = await db.insert(companies).values({
            ...body,
            companyId: body.companyId || sno
        }).returning();

        return NextResponse.json(newData[0]);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
