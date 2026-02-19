import { db } from '../../src/lib/db'
import { generateContent } from '../../src/core/generator'

// Mocking NextRequest/Response would be complex here for integration.
// Instead we test the logic via DB manipulations and core functions.

describe('Phase 9: Global Competition Integration', () => {
    let seasonId: string
    let userId: string
    let qualifierId: string

    beforeAll(async () => {
        // Cleanup
        await db.qualifierEntry.deleteMany()
        await db.qualifier.deleteMany()
        await db.season.deleteMany()
        await db.user.deleteMany({ where: { email: 'test_p9@example.com' } })
    })

    test('1. Season and User Setup', async () => {
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
                id: 'TEST_USER_9',
                email: 'test_p9@example.com',
                region: 'EU',
                cr: 1200
            }
        })
        userId = user.id

        expect(season).toBeDefined()
        expect(user.region).toBe('EU')
    })

    test('2. Qualifier Lifecycle (Start & Submit)', async () => {
        // Create Qualifier
        const weekStart = new Date()
        weekStart.setHours(0, 0, 0, 0)
        // Adjust to monday for consistency with logic if needed, but our logic uses exact match

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
                seed: 12345, // Simplified
                ratingAtEntry: 1200,
                score: 0
            }
        })

        expect(entry).toBeDefined()

        // Generate Content Check
        const q1 = generateContent({ skillId: 'math-add-1', difficulty: 1, seed: `${qualifierId}_q1` })
        const q1_again = generateContent({ skillId: 'math-add-1', difficulty: 1, seed: `${qualifierId}_q1` })
        expect(q1.question).toBe(q1_again.question) // Determinism check

        // Submit
        await db.qualifierEntry.update({
            where: { id: entry.id },
            data: {
                score: 100,
                completedAt: new Date()
            }
        })

        const updated = await db.qualifierEntry.findUnique({ where: { id: entry.id } })
        expect(updated?.score).toBe(100)
    })

    test('3. Admin Lock & Finalist Selection', async () => {
        // Convert to logic from admin route
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

        expect(finalist).toBeDefined()

        const list = await db.globalFinalist.findMany({ where: { globalFinalId: final.id } })
        expect(list.length).toBe(1)
    })
})
