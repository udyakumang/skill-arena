import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const studentUserId = searchParams.get('studentUserId')

        if (!studentUserId) {
            return NextResponse.json({ error: "Missing studentUserId" }, { status: 400 })
        }

        // 1. Get classrooms student is in
        const enrollments = await db.classroomStudent.findMany({
            where: { studentUserId },
            select: { classroomId: true }
        })

        const classroomIds = enrollments.map(e => e.classroomId)

        if (classroomIds.length === 0) {
            return NextResponse.json({ assignments: [] })
        }

        // 2. Get assignments for those classrooms
        // Include progress for this student
        const assignments = await db.assignment.findMany({
            where: { classroomId: { in: classroomIds } },
            include: {
                classroom: { select: { name: true } },
                progress: {
                    where: { studentUserId }
                }
            },
            orderBy: { dueAt: 'asc' } // Soonest due first
        })

        // Transform to cleaner shape
        const result = assignments.map(a => ({
            ...a,
            status: a.progress[0]?.status || 'NOT_STARTED',
            bestScore: a.progress[0]?.bestScore || 0,
            attempts: a.progress[0]?.attempts || 0
        }))

        return NextResponse.json({ assignments: result })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
