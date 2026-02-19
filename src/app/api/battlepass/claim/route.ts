import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const { userId, tier } = await req.json()

        if (!userId || !tier) return NextResponse.json({ error: "Missing params" }, { status: 400 })

        const result = await db.$transaction(async (tx) => {
            // 1. Get Active BP
            const season = await tx.season.findFirst({ where: { isActive: true } })
            if (!season) throw new Error("No active season")

            const bp = await tx.battlePass.findUnique({ where: { seasonId: season.id } })
            if (!bp) throw new Error("No BP found")

            // 2. Get Progress
            const progress = await tx.userBattlePassProgress.findUnique({
                where: { userId_battlePassId: { userId, battlePassId: bp.id } }
            })
            if (!progress) throw new Error("No progress found")

            // 3. Validate Unlock
            if (tier > progress.tierUnlocked) throw new Error("Tier not unlocked yet")

            // 4. Validate Not Claimed
            const claimed = (progress.claimedTiers as number[]) || []
            if (claimed.includes(tier)) throw new Error("Already claimed")

            // 5. Get Reward Info
            const tierInfo = await tx.battlePassTier.findUnique({
                where: { battlePassId_tier: { battlePassId: bp.id, tier } }
            })
            if (!tierInfo) throw new Error("Invalid tier")

            // 6. Grant Reward
            if (tierInfo.rewardType === 'COINS') {
                const amount = parseInt(tierInfo.rewardValue)
                await tx.user.update({
                    where: { id: userId },
                    data: { coins: { increment: amount } }
                })
                // Also update wallet? Technically yes, but BP rewards might bypass daily cap or count towards it?
                // Let's bypass daily cap for BP rewards as they are "earned" differently.
            } else if (tierInfo.rewardType === 'COSMETIC') {
                const sku = tierInfo.rewardValue
                const cosmetic = await tx.cosmeticItem.findUnique({ where: { sku } })
                if (cosmetic) {
                    await tx.userCosmetic.create({
                        data: { userId, cosmeticId: cosmetic.id }
                    })
                }
            }

            // 7. Update Claimed Status
            const newClaimed = [...claimed, tier]
            await tx.userBattlePassProgress.update({
                where: { id: progress.id },
                data: { claimedTiers: newClaimed }
            })

            return { success: true, reward: tierInfo }
        })

        return NextResponse.json(result)

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
    }
}
