import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateContent } from '@/core/generator'
import { logger } from '@/lib/logger' // NEW

// Simulated "Ghost" Opponent
// In a real app, we'd fetch a recent session from a peer with similar CR.
// For MVP/Safety, we generate a bot profile and a target score based on mathematical expectation.
type GhostProfile = {
    id: string
    name: string
    cr: number
    avatar: string
}

function generateGhost(userCr: number): GhostProfile {
    // Matchmaking Logic: Find someone +/- 100 CR
    const offset = Math.floor(Math.random() * 200) - 100
    const ghostCr = Math.max(0, userCr + offset)

    const names = ["ShadowMath", "PixelMind", "LogicBot", "NumberNinja", "QuantumKid"]
    const name = names[Math.floor(Math.random() * names.length)]

    return {
        id: `bot-${Date.now()}`, // Ephemeral ID
        name,
        cr: ghostCr,
        avatar: "robot_neutral"
    }
}

function calculateTargetScore(ghostCr: number, _difficulty: number): number {
    // Heuristic: Higher CR = higher accuracy/speed
    // Base score for 10 items is 100 (10 pts each)
    // A 1000 CR player gets ~60% on Diff 5
    // A 2000 CR player gets ~90% on Diff 5

    // Simple linear model for MVP
    const basePerformance = 0.5 + (ghostCr / 4000) // 1000->0.75, 2000->1.0
    const variability = (Math.random() * 0.2) - 0.1 // +/- 10%

    const target = Math.round(10 * (basePerformance + variability))
    return Math.max(2, Math.min(10, target)) // Clamp between 2 and 10
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json()
        logger.info('Matchmaking request', 'Arena', { userId })

        // 1. Get User
        const user = await db.user.findUnique({ where: { id: userId } })
        if (!user) throw new Error("User not found")

        // 2. Find/Gen Opponent
        const ghost = generateGhost(user.cr)

        // 3. Generate Match Content (Fixed set of 10 items)
        // MVP: All Arithmetic Mixed, Diff 3-6
        const items = []
        for (let i = 0; i < 10; i++) {
            const skillId = i % 2 === 0 ? 'math-add-1' : 'math-sub-1' // Simple mix
            const content = generateContent({
                skillId,
                difficulty: 5, // Standard math arena difficulty
                tone: user.toneProfile as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                ageBand: user.ageBand
            })
            items.push({
                skillId,
                question: content.question,
                correctAnswer: content.correctAnswer,
                difficulty: 5
            })
        }

        // 4. Calculate Ghost Target Score
        const targetScore = calculateTargetScore(ghost.cr, 5)

        // 5. Create Session
        const session = await db.session.create({
            data: {
                userId,
                type: 'RANKED',
                metadata: {
                    ghost,
                    targetScore,
                    totalItems: 10
                },
                items: {
                    create: items.map(item => ({
                        skillId: item.skillId,
                        question: { text: item.question }, // Wrap in object for Json
                        correctAnswer: item.correctAnswer,
                        difficulty: item.difficulty
                    }))
                }
            },
            include: { items: true }
        })

        logger.info('Match created', 'Arena', {
            sessionId: session.id,
            opponent: ghost.name,
            targetScore
        })

        return NextResponse.json({
            sessionId: session.id,
            opponent: ghost,
            targetScore,
            items: session.items
        })

    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        logger.error('Matchmaking failed', 'Arena', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
