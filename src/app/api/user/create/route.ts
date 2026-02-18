import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateString } from '@/core/safety'

export async function POST(req: NextRequest) {
    try {
        const { name } = await req.json()

        let validName = name
        if (name) {
            const safety = validateString(name)
            if (!safety.valid) {
                return NextResponse.json({ error: safety.reason }, { status: 400 })
            }
            validName = safety.sanitized
        }

        const user = await db.user.create({
            data: {
                name: validName,
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
