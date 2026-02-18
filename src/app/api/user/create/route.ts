import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
    try {
        const user = await db.user.create({
            data: {
                role: 'STUDENT',
                ageBand: "6-8",
                toneProfile: "BALANCED"
            }
        })
        return NextResponse.json({ id: user.id })
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
