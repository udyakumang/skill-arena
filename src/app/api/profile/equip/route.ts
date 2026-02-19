import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const { userId, type, sku } = await req.json()

        if (!userId || !type || !sku) return NextResponse.json({ error: "Missing params" }, { status: 400 })

        // Verify ownership
        const item = await db.cosmeticItem.findUnique({ where: { sku } })
        if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 })

        const owned = await db.userCosmetic.findUnique({
            where: { userId_cosmeticId: { userId, cosmeticId: item.id } }
        })

        if (!owned) return NextResponse.json({ error: "Not owned" }, { status: 403 })

        const field = type === 'AVATAR' ? 'equippedAvatarSku' :
            type === 'FRAME' ? 'equippedFrameSku' :
                type === 'BACKGROUND' ? 'equippedBackgroundSku' : 'equippedEmoteSku'

        await db.user.update({
            where: { id: userId },
            data: { [field]: sku }
        })

        return NextResponse.json({ success: true })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
