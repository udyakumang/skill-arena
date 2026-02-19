import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) return NextResponse.json({ error: "UserId required" }, { status: 400 })

    try {
        // 1. Get Active Season
        const season = await db.season.findFirst({ where: { isActive: true } })
        if (!season) return NextResponse.json({ error: "No active season" }, { status: 404 })

        // 2. Get Battle Pass
        const bp = await db.battlePass.findUnique({
            where: { seasonId: season.id },
            include: { tiers: { orderBy: { tier: 'asc' } } }
        })

        if (!bp) return NextResponse.json({ error: "No Battle Pass for this season" }, { status: 404 })

        // 3. Get User Progress
        let progress = await db.userBattlePassProgress.findUnique({
            where: { userId_battlePassId: { userId, battlePassId: bp.id } }
        })

        if (!progress) {
            progress = await db.userBattlePassProgress.create({
                data: { userId, battlePassId: bp.id }
            })
        }

        return NextResponse.json({
            seasonName: season.name,
            bpName: bp.name,
            xp: progress.xpEarned,
            tierUnlocked: progress.tierUnlocked,
            claimedTiers: progress.claimedTiers,
            tiers: bp.tiers
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
