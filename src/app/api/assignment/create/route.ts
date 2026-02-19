import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createAssignmentSchema } from '@/core/apiSchemas'
import { z } from 'zod'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { teacherUserId, classroomId, title, skillId, mode, targetTier, minMastery, dueAt } = createAssignmentSchema.parse(body)

        // Verify ownership
        const classroom = await db.classroom.findFirst({
            where: { id: classroomId, teacherUserId }
        })

        if (!classroom) {
            return NextResponse.json({ error: "Classroom not found or unauthorized" }, { status: 403 })
        }

        const assignment = await db.assignment.create({
            data: {
                classroomId,
                title,
                skillId,
                mode,
                targetTier,
                minMastery,
                dueAt: dueAt ? new Date(dueAt) : null,
                createdBy: teacherUserId
            }
        })

        return NextResponse.json({ success: true, assignment })

    } catch (e: any) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: (e as any).errors }, { status: 400 })
        }
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
