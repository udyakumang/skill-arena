import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createClassroomSchema } from '@/core/apiSchemas'
import { z } from 'zod'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { teacherUserId, classroomName, schoolName, grade } = createClassroomSchema.parse(body)

        // 1. Check if user is teacher (or upgrade them for MVP)
        // In a real app we'd verify role, here we assume client checked or we auto-assign
        // Let's just create the classroom directly.

        // 2. Resolve School (Basic Logic: Find by name or Create)
        let schoolId
        if (schoolName) {
            let school = await db.school.findFirst({ where: { name: schoolName } })
            if (!school) {
                school = await db.school.create({ data: { name: schoolName } })
            }
            schoolId = school.id
        } else {
            // Default "Unassigned" school or error? For MVP let's create a generic one if missing
            let school = await db.school.findFirst({ where: { name: "Independent" } })
            if (!school) {
                school = await db.school.create({ data: { name: "Independent" } })
            }
            schoolId = school.id
        }

        // 3. Generate Join Code (Simple 6 char alphanumeric)
        // Retry logic needed for uniqueness in high volume, but for MVP `cuid` or random is fine.
        // Specification asked for "short unique".
        const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()
        let joinCode = generateCode()

        // Ensure uniqueness (simple check)
        let existing = await db.classroom.findUnique({ where: { joinCode } })
        while (existing) {
            joinCode = generateCode()
            existing = await db.classroom.findUnique({ where: { joinCode } })
        }

        const classroom = await db.classroom.create({
            data: {
                name: classroomName,
                grade,
                teacherUserId,
                schoolId,
                joinCode
            }
        })

        return NextResponse.json({ success: true, classroom })

    } catch (e: any) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: (e as any).errors }, { status: 400 })
        }
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
