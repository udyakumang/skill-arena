import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) return NextResponse.json({ error: "UserId required" }, { status: 400 })

    try {
        const user = await db.user.findUnique({
            where: { id: userId }
        })

        const inventory = await db.userCosmetic.findMany({
            where: { userId },
            include: { cosmetic: true }
        })

        return NextResponse.json({ user, inventory })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
