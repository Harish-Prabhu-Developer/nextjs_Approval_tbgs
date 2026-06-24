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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, categoryName, mainCategoryId, status } = body;

        if (type === 'main') {
            const allIds = await db.select({ id: mainCategories.mainCategoryId }).from(mainCategories);
            const nextId = allIds.length > 0 ? Math.max(...allIds.map(r => r.id)) + 1 : 1;

            const [created] = await db.insert(mainCategories).values({
                mainCategoryId: nextId,
                categoryName,
                status: status || 'Active',
            }).returning();

            return NextResponse.json(created);
        } else if (type === 'sub') {
            const allIds = await db.select({ id: subCategories.subCategoryId }).from(subCategories);
            const nextId = allIds.length > 0 ? Math.max(...allIds.map(r => r.id)) + 1 : 1;

            const [created] = await db.insert(subCategories).values({
                subCategoryId: nextId,
                mainCategoryId: mainCategoryId || null,
                subCategoryName: categoryName,
                status: status || 'Active',
            }).returning();

            return NextResponse.json(created);
        }

        return NextResponse.json({ message: 'Invalid type' }, { status: 400 });
    } catch (error) {
        console.error('Error creating category:', error);
        return NextResponse.json({ message: 'Error creating category' }, { status: 500 });
    }
}
