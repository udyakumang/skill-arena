import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        let activeSeason = await db.season.findFirst({
            where: { isActive: true }
        })

        if (!activeSeason) {
            // Create default season
            activeSeason = await db.season.create({
                data: {
                    name: "Season 1: Genesis",
                    startDate: new Date(),
                    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                    isActive: true
                }
            })
        }

        return NextResponse.json({ season: activeSeason })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
