// @ts-nocheck
const { PrismaClient } = require("@prisma/client")
const db = new PrismaClient()

function getCurrentSeasonId() {
    const now = new Date()
    const year = now.getFullYear()
    const start = new Date(year, 0, 1)
    const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
    const week = Math.ceil(days / 7)
    return `${year}-W${week}`
}

async function testLadder() {
    console.log("--- Ladder Logic Test ---")
    console.log(`Current Season ID: ${getCurrentSeasonId()}`)

    // Test Rank Query Logic
    const userId = "arena-tester" // From previous test
    const user = await db.user.findUnique({ where: { id: userId } })

    if (user) {
        const rank = await db.user.count({
            where: { cr: { gt: user.cr } }
        }) + 1
        console.log(`User ${user.name} (CR: ${user.cr}) is Rank #${rank}`)
    } else {
        console.log("Arena Tester user not found (run arena test first).")
    }
}

testLadder()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect())
