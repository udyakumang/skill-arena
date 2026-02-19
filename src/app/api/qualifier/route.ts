import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateContent, GeneratorParams } from '@/core/generator'
import { validateContent } from '@/core/validation'

// Helper to get current week's start (Monday)
function getWeekStart(date: Date = new Date()) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
}

// 1. GET /api/qualifier/leaderboard
// 2. POST /api/qualifier/start
// 3. POST /api/qualifier/submit

export async function GET(req: NextRequest) {
    // Leaderboard logic
    const { searchParams } = new URL(req.url)
    const qualifierId = searchParams.get('qualifierId')

    if (!qualifierId) return NextResponse.json({ error: "Qualifier ID required" }, { status: 400 })

    const entries = await db.qualifierEntry.findMany({
        where: { qualifierId, completedAt: { not: null } },
        orderBy: { score: 'desc' },
        take: 50,
        include: { user: { select: { name: true, region: true, division: true } } }
    })

    return NextResponse.json({ leaderboard: entries })
}

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { action } = body

    if (action === 'START') return handleStart(body)
    if (action === 'SUBMIT') return handleSubmit(body)

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}

async function handleStart(body: any) {
    const { userId, skillId } = body
    if (!userId || !skillId) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // 1. Find or Create Current Qualifier
    // Need an active season? For MVP, assume a default or active season.
    const activeSeason = await db.season.findFirst({ where: { isActive: true } })
    const seasonId = activeSeason?.id || "SEASON_1_DEFAULT" // Fallback

    const region = user.region || 'IN'
    const weekStart = getWeekStart()

    let qualifier = await db.qualifier.findUnique({
        where: {
            seasonId_skillId_region_weekStart: {
                seasonId, skillId, region, weekStart
            }
        }
    })

    if (!qualifier) {
        // Create if not exists (Lazy creation)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)

        // Ensure Season Exists if we are using default
        if (seasonId === "SEASON_1_DEFAULT" && !activeSeason) {
            await db.season.upsert({
                where: { id: "SEASON_1_DEFAULT" },
                update: {},
                create: { id: "SEASON_1_DEFAULT", name: "Alpha Season", startDate: new Date(), endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), isActive: true }
            })
        }

        qualifier = await db.qualifier.create({
            data: {
                seasonId,
                skillId,
                region,
                weekStart,
                weekEnd,
                status: 'OPEN'
            }
        })
    }

    if (qualifier.status !== 'OPEN') {
        return NextResponse.json({ error: "Qualifier is not open" }, { status: 403 })
    }

    // 2. Check for existing entry
    const existingEntry = await db.qualifierEntry.findUnique({
        where: { qualifierId_userId: { qualifierId: qualifier.id, userId } }
    })

    if (existingEntry) {
        return NextResponse.json({ error: "You have already attempted this qualifier." }, { status: 403 })
    }

    // 3. Create Entry & Generate Questions
    // Seed = QualifierID ensures everyone in this qualifier region gets SAME questions
    // This is "Standardized Challenge"
    const seed = qualifier.id

    // Generate 10 questions
    const items = []
    const QUESTIONS_COUNT = 10
    // We purposefully mix difficulty? Or fixed? Prompt says "fixed difficulty ramp".
    // Let's do a ramp: 1-10
    for (let i = 1; i <= QUESTIONS_COUNT; i++) {
        // Seed needs to be unique per question index but deterministic
        const qSeed = `${seed}_q${i}`
        const params: GeneratorParams = {
            skillId,
            difficulty: i, // Ramp
            tone: 'BALANCED', // Default
            ageBand: '10-12', // Standardized
            seed: qSeed
        }
        items.push({ ...generateContent(params), id: i }) // Add ID for tracking
    }

    // Create Entry
    const entry = await db.qualifierEntry.create({
        data: {
            qualifierId: qualifier.id,
            userId,
            skillId,
            region,
            seed: 0, // Not using int seed anymore, using string seed logic derived from ID. But field is Int? 
            // Schema has `seed Int`.
            // My generator uses string seed.
            // Let's store a numeric seed if we want, or just ignore this field usage for now.
            // Let's set it to 0. 
            ratingAtEntry: user.cr,
            score: 0
        }
    })

    return NextResponse.json({
        qualifierId: qualifier.id,
        entryId: entry.id,
        items
    })
}

async function handleSubmit(body: any) {
    const { userId, qualifierId, answers } = body // answers: { [questionIndex: number]: string }

    const entry = await db.qualifierEntry.findUnique({
        where: { qualifierId_userId: { qualifierId, userId } }
    })

    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    if (entry.completedAt) return NextResponse.json({ error: "Already submitted" }, { status: 403 })

    // Regenerate to Validate
    // Seed logic must match handleStart
    const seed = qualifierId
    let score = 0
    let correctCount = 0
    const QUESTIONS_COUNT = 10

    // Anti-cheat: Speed check? (Passed from client? No, safer to check server time diff, but we didn't store start time in DB...)
    // createdAt is start time.
    const durationSec = (Date.now() - entry.createdAt.getTime()) / 1000
    if (durationSec < 10) { // Impossible speed
        // Log safety event
        await db.safetyEventLog.create({
            data: { userId, eventType: "QUALIFIER_SPEED_VIOLATION", details: { duration: durationSec } }
        })
        return NextResponse.json({ error: "Submission rejected: Too fast" }, { status: 403 })
    }
    const MAX_DURATION = 60 * 6 + 30 // 6 mins + buffer
    if (durationSec > MAX_DURATION) {
        return NextResponse.json({ error: "Time limit exceeded" }, { status: 403 })
    }

    for (let i = 1; i <= QUESTIONS_COUNT; i++) {
        const qSeed = `${seed}_q${i}`
        const content = generateContent({
            skillId: entry.skillId,
            difficulty: i,
            tone: 'BALANCED',
            ageBand: '10-12',
            seed: qSeed
        })

        const userAns = answers[i]
        // Exact match for now
        if (userAns === content.correctAnswer) {
            score += 10
            correctCount++
        } else {
            score -= 3 // Penalty
        }
    }

    // Speed bonus: if < 3 mins (180s) and reasonable score
    if (durationSec < 180 && correctCount > 5) {
        score += 2 * correctCount // bonus per correct
    }

    // Update Entry
    await db.qualifierEntry.update({
        where: { id: entry.id },
        data: {
            score,
            completedAt: new Date()
        }
    })

    // Update Daily Aggregate (Phase 8 integration)
    // We treat this as one aggregate update?
    // Let's do a simple upsert
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    await db.dailySkillAggregate.upsert({
        where: { userId_skillId_date: { userId, skillId: entry.skillId, date: today } },
        update: { attempts: { increment: QUESTIONS_COUNT }, correct: { increment: correctCount } },
        create: { userId, skillId: entry.skillId, date: today, attempts: QUESTIONS_COUNT, correct: correctCount }
    })

    return NextResponse.json({ success: true, score })
}
