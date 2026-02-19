import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateContent, GeneratorParams } from '@/core/generator'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const globalFinalId = searchParams.get('globalFinalId')

    if (!globalFinalId) return NextResponse.json({ error: "Final ID required" }, { status: 400 })

    const finalists = await db.globalFinalist.findMany({
        where: { globalFinalId, finalScore: { not: null } },
        orderBy: { finalScore: 'desc' },
        take: 100,
        include: { user: { select: { name: true, region: true, division: true } } }
    })

    return NextResponse.json({ leaderboard: finalists })
}

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { action } = body

    if (action === 'START') return handleStart(body)
    if (action === 'SUBMIT') return handleSubmit(body)

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}

async function handleStart(body: any) {
    const { userId, globalFinalId } = body
    if (!userId || !globalFinalId) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    // Check eligibility
    const finalist = await db.globalFinalist.findUnique({
        where: { globalFinalId_userId: { globalFinalId, userId } }
    })

    if (!finalist) return NextResponse.json({ error: "Not a finalist" }, { status: 403 })
    if (finalist.completedAt) return NextResponse.json({ error: "Already completed" }, { status: 403 })

    const final = await db.globalFinal.findUnique({ where: { id: globalFinalId } })
    if (final?.status !== 'LIVE') return NextResponse.json({ error: "Finals not live" }, { status: 403 })

    // Generate Questions
    // Higher difficulty for finals
    // Seed = FinalID (Same questions for all finalists!)
    const items = []
    const QUESTIONS_COUNT = 15
    const seed = globalFinal.id

    for (let i = 1; i <= QUESTIONS_COUNT; i++) {
        const qSeed = `${seed}_final_q${i}`
        items.push({
            ...generateContent({
                skillId: final.skillId,
                difficulty: Math.min(i + 5, 20), // Higher diff
                tone: 'COMPETITIVE', // Mock tone
                ageBand: '10-12',
                seed: qSeed
            }),
            id: i
        })
    }

    return NextResponse.json({
        finalId: final.id,
        items
    })
}

async function handleSubmit(body: any) {
    const { userId, globalFinalId, answers } = body

    const finalist = await db.globalFinalist.findUnique({
        where: { globalFinalId_userId: { globalFinalId, userId } }
    })
    if (!finalist) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (finalist.completedAt) return NextResponse.json({ error: "Completed" }, { status: 403 })

    const final = await db.globalFinal.findUnique({ where: { id: globalFinalId } })
    if (!final) return NextResponse.json({ error: "Final not found" }, { status: 404 })

    // Score
    let score = 0
    const QUESTIONS_COUNT = 15
    const seed = globalFinal.id

    for (let i = 1; i <= QUESTIONS_COUNT; i++) {
        const qSeed = `${seed}_final_q${i}`
        const content = generateContent({
            skillId: final.skillId,
            difficulty: Math.min(i + 5, 20),
            tone: 'COMPETITIVE',
            ageBand: '10-12',
            seed: qSeed
        })

        if (answers[i] === content.correctAnswer) {
            score += 20 // Higher points
        } else {
            score -= 5
        }
    }

    // Time Check (Anti-cheat omitted for brevity, but needed in prod)

    await db.globalFinalist.update({
        where: { id: finalist.id },
        data: {
            finalScore: score,
            completedAt: new Date()
        }
    })

    return NextResponse.json({ success: true, score })
}
