import { NextRequest, NextResponse } from 'next/server'
import { getDailyQuestStatus } from '@/core/quest'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get('userId')
        if (!userId) throw new Error('UserId required')

        const status = await getDailyQuestStatus(userId)
        return NextResponse.json(status)
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        logger.error('Quest fetch failed', 'Quest', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
