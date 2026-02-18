import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateNewRating } from '@/core/rating'

export async function POST(req: NextRequest) {
    try {
        const { sessionId, userId } = await req.json()

        // 1. Get Session & User
        const session = await db.session.findUnique({
            where: { id: sessionId },
            include: { items: true }
        })
        if (!session) throw new Error("Session not found")
        if (session.userId !== userId) throw new Error("Unauthorized")
        if (session.status === 'COMPLETED') throw new Error("Session already completed")

        const user = await db.user.findUnique({ where: { id: userId } })
        if (!user) throw new Error("User not found")

        // 2. Calculate User Score (Simple: 1 pt per correct answer)
        const userScore = session.items.filter((i: { isCorrect: boolean }) => i.isCorrect).length

        // 3. Get Ghost Target
        const metadata = session.metadata as any // eslint-disable-line @typescript-eslint/no-explicit-any
        const targetScore = metadata?.targetScore || 5 // Default if missing
        const ghostCr = metadata?.ghost?.cr || 1000

        // 4. Determine Outcome (Win/Loss/Draw)
        let matchResult = 0.5
        if (userScore > targetScore) matchResult = 1.0
        else if (userScore < targetScore) matchResult = 0.0

        // 5. Calculate ELO Change
        // Count previous ranked games for K-factor
        const gamesPlayed = await db.session.count({
            where: {
                userId,
                type: 'RANKED',
                status: 'COMPLETED'
            }
        })
        const ratingUpdate = calculateNewRating(user.cr, ghostCr, matchResult, gamesPlayed)

        // 6. Update DB
        // Transaction to ensure atomic update
        await db.$transaction([
            db.user.update({
                where: { id: userId },
                data: { cr: ratingUpdate.newRating }
            }),
            db.session.update({
                where: { id: sessionId },
                data: {
                    status: 'COMPLETED',
                    endTime: new Date(),
                    crChange: ratingUpdate.ratingChange,
                    xpEarned: userScore * 10 + (matchResult === 1 ? 50 : 10) // Bonus for winning
                }
            })
        ])

        return NextResponse.json({
            userScore,
            targetScore,
            outcome: matchResult === 1 ? 'WIN' : matchResult === 0 ? 'LOSS' : 'DRAW',
            oldCr: user.cr,
            newCr: ratingUpdate.newRating,
            crChange: ratingUpdate.ratingChange
        })

    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
