import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const { userId, sku } = await req.json()

        if (!userId || !sku) {
            return NextResponse.json({ error: "Missing userId or sku" }, { status: 400 })
        }

        const result = await db.$transaction(async (tx) => {
            // 1. Fetch Item
            const item = await tx.cosmeticItem.findUnique({
                where: { sku, isActive: true }
            })
            if (!item) throw new Error("Item not found or inactive")

            // 2. Check Ownership
            const existing = await tx.userCosmetic.findUnique({
                where: { userId_cosmeticId: { userId, cosmeticId: item.id } }
            })
            if (existing) throw new Error("Item already owned")

            // 3. Check Balance & Deduct
            const user = await tx.user.findUnique({ where: { id: userId } })
            if (!user) throw new Error("User not found")

            if (user.coins < item.coinCost) {
                throw new Error("Insufficient coins")
            }

            // Deduct coins
            await tx.user.update({
                where: { id: userId },
                data: { coins: { decrement: item.coinCost } }
            })

            // 4. Grant Item
            await tx.userCosmetic.create({
                data: {
                    userId,
                    cosmeticId: item.id
                }
            })

            // 5. Log Purchase
            await tx.purchaseLog.create({
                data: {
                    userId,
                    sku: item.sku,
                    costCoins: item.coinCost,
                    details: { itemName: item.name, type: item.type }
                }
            })

            return { success: true, item, remainingCoins: user.coins - item.coinCost }
        })

        return NextResponse.json(result)

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
    }
}
