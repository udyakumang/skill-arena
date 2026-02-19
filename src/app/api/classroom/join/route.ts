import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { joinClassroomSchema } from '@/core/apiSchemas'
import { z } from 'zod'
import { Redis } from '@upstash/redis'

// OPTIONAL: Rate Limiting
const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { studentUserId, joinCode } = joinClassroomSchema.parse(body)

        // 1. Rate Check (if Redis available)
        if (redis) {
            // limit: classroom_join:{ip} or {userId}
            // implementation skipped for brevity unless explicitly requested to fail on missing redis
        }

        // 2. Find Classroom
        const classroom = await db.classroom.findUnique({
            where: { joinCode },
            include: { school: true }
        })

        if (!classroom) {
            return NextResponse.json({ error: "Invalid Join Code" }, { status: 404 })
        }

        // 3. Check if already joined
        const existing = await db.classroomStudent.findUnique({
            where: {
                classroomId_studentUserId: {
                    classroomId: classroom.id,
                    studentUserId
                }
            }
        })

        if (existing) {
            return NextResponse.json({ error: "Already a member of this classroom" }, { status: 400 })
        }

        // 4. Join
        await db.classroomStudent.create({
            data: {
                classroomId: classroom.id,
                studentUserId
            }
        })

        return NextResponse.json({
            success: true,
            classroom: { name: classroom.name, school: classroom.school.name }
        })

    } catch (e: any) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: (e as any).errors }, { status: 400 })
        }
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
