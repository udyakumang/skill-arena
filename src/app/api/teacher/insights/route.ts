import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const teacherUserId = searchParams.get('teacherUserId')
        const classroomId = searchParams.get('classroomId')

        if (!teacherUserId || !classroomId) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
        }

        // Verify ownership
        const classroom = await db.classroom.findFirst({
            where: { id: classroomId, teacherUserId }
        })

        if (!classroom) return NextResponse.json({ error: "Classroom not found" }, { status: 404 })

        // 1. Roster Summary
        const students = await db.classroomStudent.findMany({
            where: { classroomId },
            include: { student: { select: { id: true, name: true, image: true, level: true, division: true } } }
        })

        // 2. Assignment Completion Rates
        const assignments = await db.assignment.findMany({
            where: { classroomId },
            include: {
                progress: true
            }
        })

        const assignmentStats = assignments.map(a => ({
            id: a.id,
            title: a.title,
            totalStudents: students.length,
            completed: a.progress.filter(p => p.status === 'COMPLETED').length,
            inProgress: a.progress.filter(p => p.status === 'IN_PROGRESS').length
        }))

        // 3. Weak Skills (Aggregate from DailySkillAggregate for these students)
        const studentIds = students.map(s => s.student.id)

        // This query might be heavy, for MVP we do a simple aggregation of recent fails
        // In real app, offload to analytics dedicated table
        const weakSkillsRaw = await db.dailySkillAggregate.groupBy({
            by: ['skillId'],
            where: {
                userId: { in: studentIds },
                masteryDelta: { lt: 0 } // Failed attempts lowered mastery
            },
            _count: {
                _all: true
            },
            orderBy: {
                _count: {
                    skillId: 'desc'
                }
            },
            take: 5
        })

        // Hydrate skill names (Mock for now or fetch if we had Skill table populated)
        // Since Skill is a model but we might not have all seeds, let's just return IDs
        const weakSkills = weakSkillsRaw.map(ws => ({
            skillId: ws.skillId,
            failCount: ws._count._all
        }))

        return NextResponse.json({
            roster: students.map(s => s.student),
            assignments: assignmentStats,
            weakSkills
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
