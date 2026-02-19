import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const parentUserId = searchParams.get('parentUserId')

    if (!parentUserId) return NextResponse.json({ error: "Parent ID required" }, { status: 400 })

    try {
        const parent = await db.user.findUnique({
            where: { id: parentUserId },
            include: { linkedChild: true }
        })

        if (!parent || !parent.linkedChild) {
            return NextResponse.json({ error: "No linked child found" }, { status: 404 })
        }

        const childId = parent.linkedChild.id

        // Fetch Overview Stats
        const [userData, recentSessions, masteryCount] = await Promise.all([
            db.user.findUnique({
                where: { id: childId },
                select: {
                    name: true,
                    division: true,
                    level: true,
                    xp: true,
                    winStreak: true,
                    cr: true,
                    badges: { include: { badge: true }, take: 5, orderBy: { earnedAt: 'desc' } }
                }
            }),
            db.session.findMany({
                where: { userId: childId, status: 'COMPLETED' },
                orderBy: { startTime: 'desc' },
                take: 5
            }),
            db.masteryState.count({
                where: { userId: childId, visibleTier: { not: 'NOVICE' } }
            })
        ])

        return NextResponse.json({
            child: userData,
            recentActivity: recentSessions,
            masteredSkillsCount: masteryCount
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
