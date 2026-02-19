import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

    try {
        const [user, mastery, inventory] = await Promise.all([
            db.user.findUnique({ where: { id: userId } }),
            db.masteryState.findMany({ where: { userId } }),
            db.userCosmetic.findMany({ where: { userId }, include: { cosmetic: true } })
        ])

        return NextResponse.json({
            user: {
                coins: user?.coins || 0,
                xp: user?.xp || 0,
                division: user?.division || 'BRONZE'
            },
            mastery: mastery.reduce((acc: any, curr: any) => ({
                ...acc,
                [curr.skillId]: { score: curr.masteryScore, stability: curr.stability }
            }), {}),
            inventory: inventory.map((i: any) => i.cosmetic.sku)
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
