import { NextResponse } from 'next/server';
import { PURCHASE_ORDER_CONVERSATION_DTL } from '@/app/config/mockData';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const poRefNo = searchParams.get('poRefNo');
    
    if (!poRefNo) {
        return NextResponse.json({ message: 'poRefNo is required' }, { status:400 });
    }
    
    // In real app, query table tbl_purchase_order_conversation
    const conversations = PURCHASE_ORDER_CONVERSATION_DTL.filter(
        (item: any) => item.poRefNo === poRefNo
    );
    
    return NextResponse.json(conversations);
}
