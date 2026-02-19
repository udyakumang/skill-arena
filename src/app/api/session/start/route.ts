import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateContent } from '@/core/generator'
import { logger } from '@/lib/logger' // NEW

// Start Session
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { userId, type = 'PRACTICE', skillId, assignmentId } = body

        if (!userId) {
            logger.warn('Session start blocked (Missing User)', 'Session', { body })
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        // Assignment Logic
        let targetSkill = skillId || 'math-add-1'
        let finalAssignmentId = assignmentId

        if (assignmentId) {
            const assignment = await db.assignment.findUnique({ where: { id: assignmentId } })
            if (assignment) {
                targetSkill = assignment.skillId
                // Ensure progress record exists
                await db.assignmentProgress.upsert({
                    where: { assignmentId_studentUserId: { assignmentId, studentUserId: userId } },
                    create: { assignmentId, studentUserId: userId, status: 'IN_PROGRESS' },
                    update: { status: 'IN_PROGRESS', updatedAt: new Date() }
                })
            } else {
                finalAssignmentId = undefined // Invalid assignment
            }
        }

        logger.info('Session start request', 'Session', { userId, type, skillId: targetSkill, assignmentId: finalAssignmentId })

        // 1. Create Session
        const session = await db.session.create({
            data: {
                userId,
                type,
                assignmentId: finalAssignmentId,
                startTime: new Date(),
            }
        })

        // 2. Generate Initial Item
        const content = generateContent({
            skillId: targetSkill,
            difficulty: 1, // Should fetch from MasteryState ideally
            tone: 'BALANCED',
            ageBand: '6-8'
        })

        // ... rest stays same
        const item = await db.sessionItem.create({
            data: {
                sessionId: session.id,
                skillId: targetSkill,
                question: content.question as any,
                correctAnswer: content.correctAnswer,
                difficulty: content.difficulty,
                isCorrect: false
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
    } catch (e: any) {
        logger.error('Session start failed', 'Session', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// Submit Answer (Separate Handler usually, but mocking structure here)
// Real app would likely use separate routes /api/session/start vs /api/session/submit
