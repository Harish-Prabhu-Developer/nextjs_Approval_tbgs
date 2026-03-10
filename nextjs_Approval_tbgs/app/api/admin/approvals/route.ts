import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dashboardCards } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const allApprovals = await db.select().from(dashboardCards).orderBy(dashboardCards.sno);
        return NextResponse.json(allApprovals);
    } catch (error) {
        console.error('Error fetching dashboard cards:', error);
        return NextResponse.json({ message: 'Error fetching dashboard cards' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { cardTitle, permissionColumn, routeSlug, approvalType, iconKey, backgroundColor } = body;

        const newCard = await db.insert(dashboardCards).values({
            sno: body.sno || Math.floor(Math.random() * 1000000),
            cardTitle,
            permissionColumn,
            routeSlug,
            approvalType,
            iconKey,
            backgroundColor: backgroundColor || 'indigo',
        }).returning();

        return NextResponse.json(newCard[0]);
    } catch (error) {
        console.error('Error creating dashboard card:', error);
        return NextResponse.json({ message: 'Error creating dashboard card' }, { status: 500 });
    }
}
