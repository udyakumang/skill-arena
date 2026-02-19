import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to get current week's start (Monday)
function getWeekStart(date: Date = new Date()) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 })

    try {
        const user = await db.user.findUnique({ where: { id: userId } })
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

        const region = user.region || 'IN'
        const activeSeason = await db.season.findFirst({ where: { isActive: true } })
        const seasonId = activeSeason?.id || "SEASON_1_DEFAULT"

        // 1. Regional Ladder Status
        // Get entry for any skill or "overall"? Since we store per skill, let's get the highest ranking one?
        // Or aggregate?
        // Let's just return the top entry if exists.
        const ladderEntry = await db.regionalLadderEntry.findFirst({
            where: {
                seasonId,
                userId,
                region
            },
            orderBy: { rating: 'desc' },
            take: 1
        })

        // Also get Top 50 snippet for this region (global or for user's skill?)
        // Let's get top 5 across all skills for now (simple leaderboard view)
        const regionalTop5 = await db.regionalLadderEntry.findMany({
            where: {
                seasonId,
                region
            },
            orderBy: { rating: 'desc' },
            take: 5,
            include: { user: { select: { name: true } } }
        })

        // 2. Qualifier Status
        const weekStart = getWeekStart()
        // Check if there is an OPEN qualifier for this region/week
        // We might not know which skillId to look for. usually specific skills are featured.
        // Let's find ANY open qualifier for this region/week.
        const qualifier = await db.qualifier.findFirst({
            where: {
                region,
                weekStart,
                status: 'OPEN'
            }
        })

        let qualifierStatus = 'NONE' // NONE | OPEN | COMPLETED
        let qualifierEntry = null

        if (qualifier) {
            const entry = await db.qualifierEntry.findUnique({
                where: { qualifierId_userId: { qualifierId: qualifier.id, userId } }
            })
            if (entry) {
                qualifierStatus = entry.completedAt ? 'COMPLETED' : 'IN_PROGRESS'
                qualifierEntry = entry
            } else {
                qualifierStatus = 'OPEN'
            }
        }

        // 3. Finals Status
        // Check if user is a finalist in any UPCOMING or LIVE final
        const finalistEntry = await db.globalFinalist.findFirst({
            where: {
                userId,
                final: {
                    status: { in: ['UPCOMING', 'LIVE'] }
                }
            },
            include: { final: true }
        })

        return NextResponse.json({
            region,
            ladder: {
                myEntry: ladderEntry,
                top5: regionalTop5
            },
            qualifier: {
                available: !!qualifier,
                id: qualifier?.id,
                skillId: qualifier?.skillId,
                status: qualifierStatus,
                myScore: qualifierEntry?.score
            },
            finals: {
                eligible: !!finalistEntry,
                finalId: finalistEntry?.globalFinalId,
                status: finalistEntry?.final.status
            }
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
