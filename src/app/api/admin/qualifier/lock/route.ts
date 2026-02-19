import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_KEY) {
        // Simple env key check for MVP
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { qualifierId, topN = 50 } = await req.json()
    if (!qualifierId) return NextResponse.json({ error: "Qualifier ID required" }, { status: 400 })

    const qualifier = await db.qualifier.findUnique({ where: { id: qualifierId } })
    if (!qualifier) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // 1. Lock Qualifier
    if (qualifier.status === 'OPEN') {
        await db.qualifier.update({
            where: { id: qualifierId },
            data: { status: 'LOCKED' }
        })
    }

    // 2. Select Finalists
    // Get top N from this qualifier
    const topEntries = await db.qualifierEntry.findMany({
        where: { qualifierId, completedAt: { not: null } },
        orderBy: { score: 'desc' },
        take: topN
    })

    // 3. Add to Global Final
    // Find upcoming/live final for this season/skill
    let final = await db.globalFinal.findUnique({
        where: { seasonId_skillId: { seasonId: qualifier.seasonId, skillId: qualifier.skillId } }
    })

    if (!final) {
        // Create if not exists
        final = await db.globalFinal.create({
            data: {
                seasonId: qualifier.seasonId,
                skillId: qualifier.skillId,
                status: 'UPCOMING',
                startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
                endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            }
        })
    }

    let addedCount = 0
    for (const entry of topEntries) {
        try {
            await db.globalFinalist.create({
                data: {
                    globalFinalId: final.id,
                    userId: entry.userId,
                    region: entry.region,
                    qualifierId: qualifier.id,
                    qualifierRank: 0, // Todo: calculate actual rank if needed
                    seed: entry.seed
                }
            })
            addedCount++
        } catch (e) {
            // Ignore duplicates
        }
    }

    return NextResponse.json({
        success: true,
        qualifierStatus: 'LOCKED',
        finalistsAdded: addedCount,
        finalId: final.id
    })
}
