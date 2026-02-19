
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateContent } from '@/core/generator'
import { XP_EVENTS } from '@/core/xp'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 })

    // Seed based on Date (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0]

    // Deterministic generation for the day
    // We generate 5 questions
    const questions = []
    for (let i = 0; i < 5; i++) {
        // Seed: Date + Index. Ensures same questions for everyone on same day.
        const seed = `${today}-daily-${i}`

        // We can rotate skills based on day of week or just use a fixed "Daily Mix"
        // Using seeded random to pick skill?
        const skills = ['math-add-1', 'math-sub-1', 'math-mul-1']
        const skillSeedVal = seed.charCodeAt(0) + seed.charCodeAt(seed.length - 1)
        const skillId = skills[skillSeedVal % skills.length]

        const content = generateContent({
            skillId,
            difficulty: 2, // Fixed difficulty for daily
            tone: "BALANCED" as any,
            ageBand: "10-12",
            seed: seed
        })
        questions.push({ id: i, ...content })
    }

    // Check if user already submitted today
    // Since DailyChallengeLog definition is new, strict check might be tricky if migration failed
    // Assuming schema is up or we cope
    let completed = false
    try {
        const existing = await db.dailyChallengeLog.findFirst({
            where: {
                userId,
                createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        })
        if (existing) completed = true
    } catch (e) {
        console.warn("Checking existing daily challenge failed (DB Schema mismatch?)", e)
    }

    return NextResponse.json({
        date: today,
        questions,
        completed
    })
}

export async function POST(req: NextRequest) {
    try {
        const { userId, score, total } = await req.json()

        // Save Attempt
        await db.dailyChallengeLog.create({
            data: {
                userId,
                skillId: 'daily-mix',
                score: score,
                completed: true
            }
        })

        // Award XP
        await db.user.update({
            where: { id: userId },
            data: {
                xp: { increment: XP_EVENTS.DAILY_CHALLENGE_COMPLETE }
            }
        })

        // Bonus CR if score is high
        let crBonus = 0
        if (score / total >= 0.8) {
            crBonus = 10
            await db.user.update({
                where: { id: userId },
                data: { cr: { increment: crBonus } }
            })
        }

        return NextResponse.json({
            success: true,
            xpEarned: XP_EVENTS.DAILY_CHALLENGE_COMPLETE,
            crEarned: crBonus
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
