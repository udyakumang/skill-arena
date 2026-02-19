import { db } from '../../src/lib/db'
import { generateContent } from '../../src/core/generator'

async function runTest() {
    console.log("Starting Phase 9 Integration Test...")

    let seasonId: string
    let userId: string
    let qualifierId: string

    try {
        // Cleanup
        console.log("Cleaning up...")
        await db.qualifierEntry.deleteMany()
        await db.qualifier.deleteMany()
        await db.season.deleteMany({ where: { id: 'TEST_SEASON_9' } })
        await db.user.deleteMany({ where: { email: 'test_p9@example.com' } })

        // 1. Season and User Setup
        console.log("1. Setting up Season and User...")
        const season = await db.season.create({
            data: {
                id: 'TEST_SEASON_9',
                name: 'Test Season 9',
                startDate: new Date(),
                endDate: new Date(Date.now() + 1000000),
                isActive: true
            }
        })
        seasonId = season.id

        const user = await db.user.create({
            data: {
                email: 'test_p9@example.com',
                region: 'EU',
                cr: 1200
            }
        })
        userId = user.id

        if (user.region !== 'EU') throw new Error("User region mismatch")
        console.log("   User created:", user.id)

        // 2. Qualifier Lifecycle
        console.log("2. Testing Qualifier Lifecycle...")
        const weekStart = new Date()
        weekStart.setHours(0, 0, 0, 0)

        const qualifier = await db.qualifier.create({
            data: {
                seasonId,
                skillId: 'math-add-1',
                region: 'EU',
                weekStart,
                weekEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: 'OPEN'
            }
        })
        qualifierId = qualifier.id

        // Start Entry
        const entry = await db.qualifierEntry.create({
            data: {
                qualifierId,
                userId,
                skillId: 'math-add-1',
                region: 'EU',
                seed: 12345,
                ratingAtEntry: 1200,
                score: 0
            }
        })
        console.log("   Entry created:", entry.id)

        // Generate Content Check
        const q1 = generateContent({ skillId: 'math-add-1', difficulty: 1, seed: `${qualifierId}_q1`, tone: 'BALANCED', ageBand: '10-12' })
        const q1_again = generateContent({ skillId: 'math-add-1', difficulty: 1, seed: `${qualifierId}_q1`, tone: 'BALANCED', ageBand: '10-12' })
        if (q1.question !== q1_again.question) throw new Error("Determinism failed")
        console.log("   Determinism verified.")

        // Submit
        await db.qualifierEntry.update({
            where: { id: entry.id },
            data: {
                score: 100,
                completedAt: new Date()
            }
        })
        console.log("   Qualifier submitted.")

        // 3. Admin Lock & Finalist Selection
        console.log("3. Testing Admin Lock & Finalist Selection...")
        await db.qualifier.update({
            where: { id: qualifierId },
            data: { status: 'LOCKED' }
        })

        // Create Final
        const final = await db.globalFinal.create({
            data: {
                seasonId,
                skillId: 'math-add-1',
                status: 'UPCOMING',
                startAt: new Date(),
                endAt: new Date(Date.now() + 100000)
            }
        })

        // Add Finalist
        const finalist = await db.globalFinalist.create({
            data: {
                globalFinalId: final.id,
                userId,
                region: 'EU',
                qualifierId,
                qualifierRank: 1,
                seed: 999
            }
        })

        if (!finalist) throw new Error("Finalist creation failed")
        console.log("   Finalist created:", finalist.id)

        console.log("SUCCESS: All Phase 9 tests passed.")

    } catch (e) {
        console.error("TEST FAILED:", e)
        process.exit(1)
    } finally {
        await db.$disconnect()
    }
}

runTest()
