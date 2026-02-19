import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const days = parseInt(searchParams.get('days') || '30')

    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 })

    try {
        const since = new Date()
        since.setDate(since.getDate() - days)

        const aggregates = await db.dailySkillAggregate.findMany({
            where: {
                userId,
                date: { gte: since }
            },
            orderBy: { date: 'asc' },
            include: { skill: { select: { name: true } } }
        })

        // 1. Total Attempts
        const totalAttempts = aggregates.reduce((sum: number, agg) => sum + agg.attempts, 0)

        // 2. Accuracy Trend (Group by Date)
        const dateMap = new Map<string, { attempts: number, correct: number }>()
        aggregates.forEach(agg => {
            const d = agg.date.toISOString().split('T')[0]
            if (!dateMap.has(d)) dateMap.set(d, { attempts: 0, correct: 0 })
            const entry = dateMap.get(d)!
            entry.attempts += agg.attempts
            entry.correct += agg.correct
        })

        const accuracyTrend = Array.from(dateMap.entries()).map(([date, data]) => ({
            date,
            accuracy: data.attempts > 0 ? (data.correct / data.attempts) * 100 : 0
        }))

        // 3. Improvement Highlights (Highest Delta)
        const improvements = aggregates
            .filter((a) => a.masteryDelta > 0)
            .sort((a, b) => b.masteryDelta - a.masteryDelta)
            .slice(0, 5)
            .map((a) => ({
                skill: a.skill.name,
                delta: a.masteryDelta,
                date: a.date
            }))

        return NextResponse.json({
            summary: {
                totalAttempts,
                accuracyTrend,
                improvementHighlights: improvements
            }
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
