import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { userId, localChanges } = body

        if (!userId || !localChanges) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 })
        }

        // localChanges might contain: mastery scores, coins (ignore coins), attempts
        // This is primarily for "Guest -> User" merge on first login
        // Or "Offline -> Online" if we track state locally in a blob

        // For MVP, let's assume localChanges has { mastery: Record<skillId, {score, stability}> }

        const masteryUpdates = []

        if (body.mastery) {
            for (const [skillId, localState] of Object.entries(body.mastery as Record<string, any>)) {
                // Fetch server state
                const serverState = await db.masteryState.findUnique({
                    where: { userId_skillId: { userId, skillId } }
                })

                if (!serverState) {
                    // New skill for user, adopt local
                    await db.masteryState.create({
                        data: {
                            userId,
                            skillId,
                            score: localState.score,
                            stability: localState.stability,
                            lastPracticedAt: new Date()
                        }
                    })
                } else {
                    // Merge: Max score, Max stability
                    const newScore = Math.max(serverState.score, localState.score)
                    const newStability = Math.max(serverState.stability, localState.stability)

                    if (newScore !== serverState.score || newStability !== serverState.stability) {
                        await db.masteryState.update({
                            where: { id: serverState.id },
                            data: {
                                score: newScore,
                                stability: newStability,
                                lastPracticedAt: new Date()
                            }
                        })
                    }
                }
            }
        }

        // Coins: We DO NOT sync coins from local blindly to avoid cheating.
        // We only re-calculate based on replayed "Purchase" or "Submit" logs in the Queue.
        // So this endpoint ignores coins.

        return NextResponse.json({ success: true, syncedAt: new Date() })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
