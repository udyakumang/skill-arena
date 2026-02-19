import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const items = await db.cosmeticItem.findMany({
            where: { isActive: true },
            orderBy: { coinCost: 'asc' }
        })
        return NextResponse.json({ items })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
