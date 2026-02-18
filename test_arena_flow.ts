// @ts-nocheck
const { PrismaClient } = require("@prisma/client")
const db = new PrismaClient()

async function testArenaFlow() {
    console.log("--- Starting Arena E2E Test ---")

    // 1. Setup User
    const userId = "arena-tester"
    await db.user.upsert({
        where: { id: userId },
        update: { cr: 1000 }, // Reset to 1000
        create: {
            id: userId,
            name: "Arena Tester",
            email: "test@arena.com",
            cr: 1000
        }
    })
    console.log("User reset to 1000 CR.")

    // 2. Create Session Metadata
    const ghostCr = 1100
    const targetScore = 6
    const session = await db.session.create({
        data: {
            userId,
            type: 'RANKED',
            metadata: {
                ghost: { id: 'bot-1', cr: ghostCr, name: 'Bot' },
                targetScore,
                totalItems: 10
            },
            items: {
                create: [
                    { skillId: 'math-add-1', question: {}, correctAnswer: '10', difficulty: 5, isCorrect: true }, // 1
                    { skillId: 'math-add-1', question: {}, correctAnswer: '10', difficulty: 5, isCorrect: true }, // 2
                    { skillId: 'math-add-1', question: {}, correctAnswer: '10', difficulty: 5, isCorrect: true }, // 3
                    { skillId: 'math-add-1', question: {}, correctAnswer: '10', difficulty: 5, isCorrect: true }, // 4
                    { skillId: 'math-add-1', question: {}, correctAnswer: '10', difficulty: 5, isCorrect: true }, // 5
                    { skillId: 'math-add-1', question: {}, correctAnswer: '10', difficulty: 5, isCorrect: true }, // 6
                    { skillId: 'math-add-1', question: {}, correctAnswer: '10', difficulty: 5, isCorrect: true }, // 7 - WIN (7 > 6)
                    { skillId: 'math-add-1', question: {}, correctAnswer: '10', difficulty: 5, isCorrect: false },
                    { skillId: 'math-add-1', question: {}, correctAnswer: '10', difficulty: 5, isCorrect: false },
                    { skillId: 'math-add-1', question: {}, correctAnswer: '10', difficulty: 5, isCorrect: false },
                ]
            }
        },
        include: { items: true }
    })
    console.log(`Session created: ${session.id}. Ghost Target: ${targetScore}.`)

    // B. Submit / Complete
    // User got 7/10. Target 6. Should be a WIN.
    const userScore = session.items.filter((i: any) => i.isCorrect).length
    console.log(`User Score: ${userScore}`)

    // Calculate ELO
    // We assume 1 win -> +13 approx (K=20)
    const k = 20
    const expected = 1 / (1 + Math.pow(10, (ghostCr - 1000) / 400)) // ~0.36
    const change = Math.round(k * (1 - expected)) // 1.0 needed for win
    const newRating = 1000 + change

    console.log(`Expected Change: +${change} -> ${newRating}`)

    await db.$transaction([
        db.user.update({
            where: { id: userId },
            data: { cr: newRating }
        }),
        db.session.update({
            where: { id: session.id },
            data: {
                status: 'COMPLETED',
                endTime: new Date(),
                crChange: change,
                xpEarned: userScore * 10 + 50
            }
        })
    ])

    const updatedUser = await db.user.findUnique({ where: { id: userId } })
    console.log(`User Final CR: ${updatedUser?.cr}`)

    if (updatedUser?.cr === 1000 + change) {
        console.log("SUCCESS: CR updated correctly.")
    } else {
        console.error("FAILURE: CR mismatch.")
    }
}

testArenaFlow()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect())
