import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mainCategories, subCategories } from '@/db/schema';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    try {
        if (type === 'main') {
            const data = await db.select().from(mainCategories);
            return NextResponse.json(data);
        } else if (type === 'sub') {
            const mainId = searchParams.get('mainId');
            let query = db.select().from(subCategories);
            // If mainId provided, filter sub categories
            const data = await query;
            if (mainId) {
                return NextResponse.json(data.filter(s => s.mainCategoryId === Number(mainId)));
            }
            return NextResponse.json(data);
        }
        return NextResponse.json({ message: 'Invalid type' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
