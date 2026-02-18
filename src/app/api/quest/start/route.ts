import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { startQuestSession } from '@/core/quest'

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json()

        // 1. Get User Context
        const user = await db.user.findUnique({ where: { id: userId } })
        if (!user) throw new Error('User not found')

        // 2. Generate Quest
        const config = await startQuestSession()

        // 3. Create Session Record (Type: QUEST or PRACTICE)
        // For MVP, we treat "Daily Quest" as a structured session
        const session = await db.session.create({
            data: {
                userId,
                type: 'PRACTICE', // Using PRACTICE enum for now
                startTime: new Date()
            }
        })

        return NextResponse.json({
            sessionId: session.id,
            config
        })

    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
