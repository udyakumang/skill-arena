import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SimpleCache } from '@/lib/cache'

// Helper to get current Season ID (e.g. "2024-W10")
function getCurrentSeasonId() {
    const now = new Date()
    const year = now.getFullYear()
    const start = new Date(year, 0, 1)
    const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
    const week = Math.ceil(days / 7)
    return `${year}-W${week}`
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const type = searchParams.get('type') || 'GLOBAL'
        const region = searchParams.get('region')

        // MVP: Just query Users sorted by CR descending
        // Ideally we would use the LadderEntry table, but for now we can just use User.cr directly 
        // as the "Live" ladder, or sync it to LadderEntry.
        // Let's use User.cr for simplicity in Phase 4.2 MVP. 
        // 0. Check Cache (Global Only)
        const cacheKey = `ladder_${type}_${region || 'global'}`
        const cached = SimpleCache.get(cacheKey)
        if (cached) return NextResponse.json(cached)

        // 1. Fetch Top 50
        const where: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any
        if (type === 'REGIONAL' && region) {
            where.countryCode = region
        }

        const leaderboard = await db.user.findMany({
            where,
            orderBy: { cr: 'desc' },
            take: 50,
            select: {
                id: true,
                name: true,
                cr: true,
                countryCode: true,
                avatarConfig: true,
                // We could derive League from CR dynamically here
            }
        })

        // 2. Map Key Fields
        const safeBoard = leaderboard.map((u: any, index: number) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
            rank: index + 1,
            ...u,
            league: getLeagueFromCR(u.cr)
        }))

        const response = {
            seasonId: getCurrentSeasonId(),
            leaderboard: safeBoard
        }

        SimpleCache.set(cacheKey, response, 60)

        return NextResponse.json(response)

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
