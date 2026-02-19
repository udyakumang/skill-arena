import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) return NextResponse.json({ error: "UserId required" }, { status: 400 })

    try {
        const entitlements = await db.entitlement.findMany({
            where: {
                userId,
                status: 'ACTIVE',
                // Check dates? OR handling expiry via cron/webhook?
                // For now, let's also check endAt if present.
                OR: [
                    { endsAt: null },
                    { endsAt: { gt: new Date() } }
                ]
            }
        })

        const isPremium = entitlements.some(e => e.type === 'PREMIUM')
        const isFamilyParent = entitlements.some(e => e.type === 'FAMILY_PARENT')
        const isFamilyChild = entitlements.some(e => e.type === 'FAMILY_CHILD')

        return NextResponse.json({
            entitlements: entitlements.map(e => ({ type: e.type, expire: e.endsAt })),
            isPremium,
            isFamilyParent,
            isFamilyChild
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
