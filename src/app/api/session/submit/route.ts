import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { updateMasteryState } from '@/core/mastery'
import { generateContent } from '@/core/generator'
import { selectAnimation } from '@/core/animation'
import { calculateNewStreak } from '@/core/streak'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
    try {
        const { sessionId, itemId, userAnswer, timeTakenMs, hintsUsed } = await req.json()

        // 1. Get Item & Session
        const item = await db.sessionItem.findUnique({ where: { id: itemId } })
        if (!item) throw new Error('Item not found')

        const isCorrect = userAnswer === item.correctAnswer

        // 2. Update Item Log
        await db.sessionItem.update({
            where: { id: itemId },
            data: { userAnswer, isCorrect, timeTakenMs, hintsUsed }
        })

        // 3. Update Mastery (The Brain)
        const session = await db.session.findUnique({ where: { id: sessionId }, include: { user: true } })
        if (!session) throw new Error('Session not found')

        // Fetch existing state or create default
        const dbMastery = await db.masteryState.findUnique({
            where: { userId_skillId: { userId: session.userId, skillId: item.skillId } }
        })

        // Map DB state to Core Logic State
        const logicState = dbMastery ? {
            score: dbMastery.score,
            stability: dbMastery.stability,
            frustration: dbMastery.frustration,
            confidence: dbMastery.confidence,
            streak: dbMastery.streak,
            currentDifficulty: dbMastery.currentDifficulty,
            highestDifficultySolved: dbMastery.highestDifficultySolved,
            history: [] // Simplified for now, real app loads recent items
        } : {
            score: 0, stability: 0, frustration: 0, confidence: 50, streak: 0,
            currentDifficulty: 1, highestDifficultySolved: 0, history: []
        }

        // 47. Run Logic
        const nextState = updateMasteryState(logicState, {
            isCorrect, timeTakenMs, hintsUsed, difficulty: item.difficulty
        })

        // Calculate Streak (Daily Logic)
        const dailyStreak = calculateNewStreak(dbMastery?.streak || 0, dbMastery?.lastPracticedAt || null)
        nextState.streak = dailyStreak

        // Persist State
        await db.masteryState.upsert({
            where: { userId_skillId: { userId: session.userId, skillId: item.skillId } },
            update: {
                score: nextState.score,
                stability: nextState.stability,
                frustration: nextState.frustration,
                confidence: nextState.confidence,
                streak: nextState.streak,
                currentDifficulty: nextState.currentDifficulty,
                highestDifficultySolved: nextState.highestDifficultySolved,
                lastPracticedAt: new Date()
            },
            create: {
                userId: session.userId,
                skillId: item.skillId,
                score: nextState.score,
                stability: nextState.stability,
                frustration: nextState.frustration,
                confidence: nextState.confidence,
                streak: nextState.streak,
                currentDifficulty: nextState.currentDifficulty,
                highestDifficultySolved: nextState.highestDifficultySolved
            }
        })

        // 6. Update Daily Quest Progress
        if (isCorrect) {
            const today = new Date().toISOString().split('T')[0]
            const questState = await db.userQuestState.findUnique({ where: { userId: session.userId } })

            if (questState && questState.date.toISOString().split('T')[0] === today) {
                const warmupId = 'math-add-1'
                const challengeId = 'math-sub-2'

                if (item.skillId === warmupId && !questState.warmupDone) {
                    await db.userQuestState.update({ where: { id: questState.id }, data: { warmupDone: true } })
                } else if (item.skillId === challengeId && !questState.gameDone) {
                    await db.userQuestState.update({ where: { id: questState.id }, data: { gameDone: true } })
                }
            }
        }

        // 7. Update Assignment Progress (Phase 13)
        if (session.assignmentId) {
            const progress = await db.assignmentProgress.findUnique({
                where: { assignmentId_studentUserId: { assignmentId: session.assignmentId, studentUserId: session.userId } },
                include: { assignment: true }
            })

            if (progress && progress.status !== 'COMPLETED') {
                // Check completion criteria
                // For MVP: If mastery > minMastery OR score > threshold. 
                // Let's use simple logic: If isCorrect and mastery score > 80 (or assignment minMastery), mark complete.
                // Or just track attempts.

                const minMastery = progress.assignment.minMastery || 80
                const isComplete = nextState.score >= minMastery

                await db.assignmentProgress.update({
                    where: { id: progress.id },
                    data: {
                        attempts: { increment: 1 },
                        bestScore: Math.max(progress.bestScore, Math.round(nextState.score)),
                        status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
                        completedAt: isComplete ? new Date() : null,
                        updatedAt: new Date()
                    }
                })
            }
        }

        // 4. Animation Selection
        const animation = selectAnimation({
            context: isCorrect ? 'CORRECT' : 'WRONG',
            masteryState: nextState,
            tone: session.user.toneProfile as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            recentAnimationIds: []
        })

        // 5. Next Item Generation (Adaptive)
        const nextContent = generateContent({
            skillId: item.skillId,
            difficulty: Math.round(nextState.currentDifficulty),
            tone: session.user.toneProfile as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            ageBand: session.user.ageBand
        })

        const nextItem = await db.sessionItem.create({
            data: {
                sessionId,
                skillId: item.skillId,
                question: nextContent.question as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                correctAnswer: nextContent.correctAnswer,
                difficulty: nextContent.difficulty,
                isCorrect: false
            }
        })

        // Logger call
        logger.info('Session item submitted', 'Session', {
            sessionId,
            itemId,
            isCorrect,
            newScore: nextState.score
        })

        // --- Phase 8: Daily Aggregates ---
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Normalize

        // Upsert Daily Aggregate
        // We catch errors here so analytics doesn't block the main game flow
        try {
            await db.dailySkillAggregate.upsert({
                where: {
                    userId_skillId_date: {
                        userId: session.userId,
                        skillId: item.skillId,
                        date: today
                    }
                },
                update: {
                    attempts: { increment: 1 },
                    correct: { increment: isCorrect ? 1 : 0 },
                    // avgDuration: approximation again or we just store sum? 
                    // Let's iterate: if we can't change schema, we'll just store last duration or ignore avg for now
                    // Actually let's use a "running average" if we query it first? No, extra query.
                    // We will just increment attempts/correct/hints.
                    hintsUsed: { increment: hintsUsed || 0 }
                },
                create: {
                    userId: session.userId,
                    skillId: item.skillId,
                    date: today,
                    attempts: 1,
                    correct: isCorrect ? 1 : 0,
                    avgDuration: timeTakenMs || 0,
                    hintsUsed: hintsUsed || 0
                }
            })
        } catch (e) {
            console.error("Failed to update daily aggregate", e)
        }

        return NextResponse.json({
            result: { isCorrect, masteryScore: nextState.score, streak: nextState.streak },
            animation,
            nextItem: {
                id: nextItem.id,
                question: nextItem.question,
                hints: nextContent.hints
            }
        })

    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        logger.error('Session submit failed', 'Session', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
