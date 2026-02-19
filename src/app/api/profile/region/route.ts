import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Region } from '@prisma/client'

export async function POST(req: NextRequest) {
    try {
        const { userId, region } = await req.json()

        if (!userId || !region) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

        if (!Object.values(Region).includes(region)) {
            return NextResponse.json({ error: "Invalid region" }, { status: 400 })
        }

        const user = await db.user.update({
            where: { id: userId },
            data: { region }
        })

        return NextResponse.json({ success: true, region: user.region })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
