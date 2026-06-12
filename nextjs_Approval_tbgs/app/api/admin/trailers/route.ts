import { NextResponse } from 'next/server';
import { db } from '@/db';
import { trailers } from '@/db/schema';

export async function GET() {
    try {
        const data = await db.select().from(trailers);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const sno = Math.floor(Math.random() * 1000000);

        const newData = await db.insert(trailers).values({
            ...body,
            trailerId: body.trailerId || sno
        }).returning();

        return NextResponse.json(newData[0]);
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
