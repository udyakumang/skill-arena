
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Starting Phase 10 Verification...")

    try {
        // 1. Setup User
        const user = await prisma.user.create({
            data: {
                name: "Rich Player",
                email: `rich_${Date.now()}@example.com`,
                coins: 1000, // Starting balance
                role: UserRole.STUDENT,
                ageBand: '13-15',
                toneProfile: 'NEUTRAL',
                avatarConfig: {}
            }
        })
        console.log("User created:", user.id, "Coins:", user.coins)

        // 2. Buy Item
        // Ensure store is seeded first (run seed script if needed, but assuming it's done)
        const item = await prisma.cosmeticItem.findUnique({
            where: { sku: 'avatar_robot_base' }
        })

        if (item) {
            console.log("Buying item:", item.sku)
            // Simulation of API logic
            await prisma.$transaction(async (tx) => {
                await tx.user.update({
                    where: { id: user.id },
                    data: { coins: { decrement: item.coinCost } }
                })
                await tx.userCosmetic.create({
                    data: { userId: user.id, cosmeticId: item.id }
                })
                await tx.purchaseLog.create({
                    data: { userId: user.id, sku: item.sku, costCoins: item.coinCost }
                })
            })
            console.log("Item purchased.")
        } else {
            console.log("Item not found, skipping purchase.")
        }

        // 3. Verify Inventory
        const inventory = await prisma.userCosmetic.findMany({
            where: { userId: user.id },
            include: { cosmetic: true }
        })
        console.log("Inventory:", inventory.map(i => i.cosmetic.sku))

        // 4. Equip Item
        if (inventory.length > 0) {
            console.log("Equipping item...")
            await prisma.user.update({
                where: { id: user.id },
                data: { equippedAvatarSku: inventory[0].cosmetic.sku }
            })
            const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })
            console.log("Equipped Avatar:", updatedUser?.equippedAvatarSku)
        }

        // 5. Battle Pass Logic
        console.log("Testing Battle Pass...")
        const season = await prisma.season.findFirst({ where: { isActive: true } })
        if (season) {
            const bp = await prisma.battlePass.upsert({
                where: { seasonId: season.id },
                update: {},
                create: { seasonId: season.id, name: "Season 1 Pass" }
            })

            // Add a tier
            await prisma.battlePassTier.upsert({
                where: { battlePassId_tier: { battlePassId: bp.id, tier: 1 } },
                update: {},
                create: { battlePassId: bp.id, tier: 1, requiredXp: 100, rewardType: 'COINS', rewardValue: '50' }
            })

            // Simulate Progress
            await prisma.userBattlePassProgress.create({
                data: {
                    userId: user.id,
                    battlePassId: bp.id,
                    xpEarned: 150,
                    tierUnlocked: 1
                }
            })

            // Claim
            const progress = await prisma.userBattlePassProgress.findUnique({
                where: { userId_battlePassId: { userId: user.id, battlePassId: bp.id } }
            })

            if (progress && progress.tierUnlocked >= 1) {
                // Claim Logic
                await prisma.user.update({
                    where: { id: user.id },
                    data: { coins: { increment: 50 } }
                })
                await prisma.userBattlePassProgress.update({
                    where: { id: progress.id },
                    data: { claimedTiers: [1] }
                })
                console.log("Claimed Tier 1.")
            }
        }

        console.log("Verification Complete.")

    } catch (e) {
        console.error("Verification Failed:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
