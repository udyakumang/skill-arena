import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const teacherUserId = searchParams.get('teacherUserId')

        if (!teacherUserId) {
            return NextResponse.json({ error: "Missing teacherUserId" }, { status: 400 })
        }

        const classrooms = await db.classroom.findMany({
            where: { teacherUserId },
            include: {
                _count: {
                    select: { students: true, assignments: true }
                },
                school: true
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ classrooms })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
