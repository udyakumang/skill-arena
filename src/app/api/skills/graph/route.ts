import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 })

    try {
        // Fetch all skills and user mastery states
        const skills = await db.skill.findMany({
            include: {
                prerequisites: true,
                masteryStates: {
                    where: { userId: userId },
                    select: {
                        score: true,
                        visibleTier: true,
                        division: true,
                        streak: true,
                        frustration: true,
                        stability: true
                    }
                }
            }
        })

        // Map and compute WeakSkillScore
        const skillGraph = skills.map(skill => {
            const mastery = skill.masteryStates[0] // Is array due to relation but unique per user

            let weakScore = 0
            if (mastery) {
                // Formula:
                // +1 for each wrong answer in last 20 attempts (Not tracking 'last 20' explicitly in MasteryState, using proxies?)
                // We don't have 'last 20 attempts' array in MasteryState. 
                // We can use 'stability' (low stability implies errors) or just simplified proxies for now.
                // Let's use `frustration` and `score` mapping for MVP.

                // Proxy: Low Score (<40) + High Frustration
                if (mastery.score < 40) weakScore += 5
                if (mastery.frustration > 50) weakScore += 3
                if (mastery.streak >= 3) weakScore -= 2 // Doing well
                if (mastery.stability < 2) weakScore += 2 // unstable
            } else {
                // Unattempted, not necessarily weak, just 0
            }

            // Clamp 0-10
            weakScore = Math.max(0, Math.min(10, weakScore))

            return {
                id: skill.id,
                name: skill.name,
                topic: skill.topic,
                tier: skill.tier,
                prerequisites: skill.prerequisites.map(p => p.prereqId),
                mastery: mastery ? {
                    score: mastery.score,
                    tier: mastery.visibleTier,
                    division: mastery.division
                } : null,
                weakSkillScore: weakScore
            }
        })

        return NextResponse.json({ graph: skillGraph })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
