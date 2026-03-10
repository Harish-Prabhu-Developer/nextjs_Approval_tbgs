import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dashboardCards } from '@/db/schema';

export async function GET() {
    try {
        const cards = await db.select().from(dashboardCards).orderBy(dashboardCards.sno);
        return NextResponse.json(cards);
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
