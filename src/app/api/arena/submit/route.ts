import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateNewRating } from '@/core/rating'
import { checkPromotion } from '@/core/division'
import { calculateLevel, XP_EVENTS, getNextLevelProgress } from '@/core/xp'
import { checkBadgeUnlocks, BADGES } from '@/core/gamification'

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

        const user = await db.user.findUnique({
            where: { id: userId },
            include: { badges: true } // Need badges for check
        })
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

        // 6. Check Promotion / Relegation
        const promo = checkPromotion(user.cr, ratingUpdate.newRating)

        // 7. Calculate XP & Level
        const xpGain = matchResult === 1 ? XP_EVENTS.RANKED_WIN : 5 // 5xp for playing/loss
        const newXp = user.xp + xpGain
        const newLevel = calculateLevel(newXp)
        const levelUp = newLevel > user.level

        // 8. Update Streak
        const newWinStreak = matchResult === 1 ? user.winStreak + 1 : 0

        // 9. Check Badges
        const newBadges = checkBadgeUnlocks({
            wins: gamesPlayed + (matchResult === 1 ? 1 : 0), // Approx
            division: promo.newDivision,
            xp: newXp,
            winStreak: newWinStreak,
            existingBadgeIds: user.badges.map(b => b.badgeId)
        })

        // 10. Persist Updates via Transaction
        await db.$transaction(async (tx) => {
            // Update User
            await tx.user.update({
                where: { id: userId },
                data: {
                    cr: ratingUpdate.newRating,
                    xp: newXp,
                    level: newLevel,
                    division: promo.newDivision, // Auto-update division
                    winStreak: newWinStreak
                }
            })

            // Update Session
            await tx.session.update({
                where: { id: sessionId },
                data: {
                    status: 'COMPLETED',
                    endTime: new Date(),
                    crChange: ratingUpdate.ratingChange,
                    xpEarned: xpGain + (userScore * 10)
                }
            })

            // Grant Badges
            for (const badgeId of newBadges) {
                // Create badge if not exists? (Badges data should be seeded)
                // We assume Badges table is seeded. If not, this might fail foreign key.
                // For safety in this MVP, we try catch or upsert if unsure.
                // Ideally Badges are static rows.
                try {
                    // Ensure Badge Definitions exist (Lazy Seeding)
                    const badgeDef = Object.values(BADGES).find(b => b.id === badgeId)
                    if (badgeDef) {
                        await tx.badge.upsert({
                            where: { name: badgeDef.name },
                            update: {},
                            create: { id: badgeDef.id, name: badgeDef.name, description: badgeDef.description, type: 'ACHIEVEMENT', icon: badgeDef.icon }
                        })

                        await tx.userBadge.create({
                            data: { userId, badgeId }
                        })
                    }
                } catch (e) {
                    console.error("Badge grant failed", e)
                }
            }
        })

        return NextResponse.json({
            userScore,
            targetScore,
            outcome: matchResult === 1 ? 'WIN' : matchResult === 0 ? 'LOSS' : 'DRAW',
            oldCr: user.cr,
            newCr: ratingUpdate.newRating,
            crChange: ratingUpdate.ratingChange,
            xpEarned: xpGain,
            levelUp,
            promotion: promo.isNewDivision ? promo : null,
            badgesEarned: newBadges
        })

    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
