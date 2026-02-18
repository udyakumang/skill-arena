import { NextResponse } from 'next/server'
import { getActiveEvents } from '@/core/events'

export async function GET() {
    const active = getActiveEvents()
    return NextResponse.json({ events: active })
}
