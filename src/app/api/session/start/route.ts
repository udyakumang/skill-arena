import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateContent } from '@/core/generator'
import { logger } from '@/lib/logger' // NEW

// Start Session
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { userId, type = 'PRACTICE', skillId } = body // Default to PRACTICE

        logger.info('Session start request', 'Session', { userId, type, skillId })

        // 1. Create Session
        const session = await db.session.create({
            data: {
                userId,
                type,
                startTime: new Date(),
            }
        })

        // 2. Generate Initial Item
        // For Diagnostic: Pick simple starter from skillId or default
        const targetSkill = skillId || 'math-add-1'
        const content = generateContent({
            skillId: targetSkill,
            difficulty: 1,
            tone: 'BALANCED',
            ageBand: '6-8'
        })

        const item = await db.sessionItem.create({
            data: {
                sessionId: session.id,
                skillId: targetSkill,
                question: content.question as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                correctAnswer: content.correctAnswer,
                difficulty: content.difficulty,
                isCorrect: false // default, updated on submit
            }
        })

        return NextResponse.json({
            sessionId: session.id,
            item: {
                id: item.id,
                question: item.question,
                hints: content.hints
            }
        })
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        logger.error('Session start failed', 'Session', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// Submit Answer (Separate Handler usually, but mocking structure here)
// Real app would likely use separate routes /api/session/start vs /api/session/submit
