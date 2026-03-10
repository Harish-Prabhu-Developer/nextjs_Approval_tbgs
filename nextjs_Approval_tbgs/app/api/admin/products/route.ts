import { NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';

export async function GET() {
    try {
        const data = await db.select().from(products);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const sno = Math.floor(Math.random() * 1000000);
        
        const newData = await db.insert(products).values({
            ...body,
            productId: body.productId || sno
        }).returning();

        return NextResponse.json(newData[0]);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
