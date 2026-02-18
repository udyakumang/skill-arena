import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')
        if (!userId) throw new Error("userId required")

        const user = await db.user.findUnique({ where: { id: userId } })
        if (!user) throw new Error("User not found")

        // Calculate Rank (Count users with higher CR)
        const rank = await db.user.count({
            where: { cr: { gt: user.cr } }
        }) + 1

        // Regional Rank
        let regionRank = null
        if (user.countryCode) {
            regionRank = await db.user.count({
                where: {
                    cr: { gt: user.cr },
                    countryCode: user.countryCode
                }
            }) + 1
        }

        return NextResponse.json({
            userId: user.id,
            cr: user.cr,
            globalRank: rank,
            regionalRank: regionRank,
            league: getLeagueFromCR(user.cr),
            countryCode: user.countryCode
        })

    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

function getLeagueFromCR(cr: number) {
    if (cr < 1200) return 'BRONZE'
    if (cr < 1400) return 'SILVER'
    if (cr < 1600) return 'GOLD'
    if (cr < 1900) return 'PLATINUM'
    if (cr < 2200) return 'DIAMOND'
    return 'ELITE'
}
