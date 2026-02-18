import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateString } from '@/core/safety'
import { logger } from '@/lib/logger' // NEW

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({})) // Handle empty body gracefully
        const { name } = body

        logger.info('User create request', 'User', { name })

        let validName = name
        let email = undefined

        if (name && typeof name === 'string') {
            // Check if input is email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (emailRegex.test(name)) {
                email = name
                validName = name.split('@')[0] // Use handle as name
                logger.info('User create: Email detected, using handle', 'User', { email, validName })
            }

            const safety = validateString(validName)
            if (!safety.valid) {
                logger.warn('User create blocked (Safety)', 'User', { name, reason: safety.reason })
                return NextResponse.json({ error: safety.reason }, { status: 400 })
            }
            validName = safety.sanitized
        } else if (name && typeof name !== 'string') {
            logger.warn('User create blocked (Invalid Type)', 'User', { name });
            return NextResponse.json({ error: "Name must be a string" }, { status: 400 });
        }

        const user = await db.user.create({
            data: {
                name: validName,
                email: email, // Store email if provided
                role: 'STUDENT',
                ageBand: "6-8",
                toneProfile: "BALANCED"
            }
        })

        logger.info('User created', 'User', { userId: user.id })
        return NextResponse.json({ id: user.id })
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        logger.error('User create failed', 'User', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
