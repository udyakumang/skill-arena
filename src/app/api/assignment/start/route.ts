import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { startAssignmentSchema } from '@/core/apiSchemas'
import { z } from 'zod'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { studentUserId, assignmentId } = startAssignmentSchema.parse(body)

        const assignment = await db.assignment.findUnique({ where: { id: assignmentId } })
        if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 })

        // Check/Create Progress
        let progress = await db.assignmentProgress.findUnique({
            where: { assignmentId_studentUserId: { assignmentId, studentUserId } }
        })

        if (!progress) {
            progress = await db.assignmentProgress.create({
                data: {
                    assignmentId,
                    studentUserId,
                    status: 'IN_PROGRESS'
                }
            })
        } else if (progress.status !== 'COMPLETED') {
            await db.assignmentProgress.update({
                where: { id: progress.id },
                data: { status: 'IN_PROGRESS' }
            })
        }

        // Ideally here we would call the centralized Session logic to create a session
        // For MVP, we'll return a payload that the client uses to start the practice loop
        // The client will call /api/session/start but passed "assignmentId" in metadata?
        // Or we create session here. Let's redirect logic to client to reuse /play logic.

        return NextResponse.json({ success: true, assignment, progress })

    } catch (e: any) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: (e as any).errors }, { status: 400 })
        }
        logger.error('Session start failed', 'Session', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
