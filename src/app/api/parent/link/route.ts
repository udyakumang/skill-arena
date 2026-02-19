import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
    try {
        const { parentUserId, childLinkCode } = await req.json()

        if (!parentUserId || !childLinkCode) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // 1. Find Child by Code
        const child = await db.user.findUnique({
            where: { childLinkCode }
        })

        if (!child) {
            // Log failure
            await db.safetyEventLog.create({
                data: {
                    userId: parentUserId,
                    eventType: 'PARENT_LINK_FAIL',
                    details: { code: childLinkCode, reason: "Invalid Code" }
                }
            })
            return NextResponse.json({ error: "Invalid Link Code" }, { status: 404 })
        }

        // 2. Link Parent to Child
        // Verify parent isn't already linked to someone else (for MVP simplicity, maybe 1:1?)
        // Schema allows parent -> linkedChild (1:1 currently based on my schema edit? 
        // Actually `linkedChild   User? @relation("ParentChild", ...)` implies one child per parent in this schema.
        // If we want multiple children, we'd need a separate relation table. 
        // For Phase 8 MVP, let's stick to single child per parent account as per schema.

        await db.user.update({
            where: { id: parentUserId },
            data: {
                role: 'PARENT',
                linkedChildId: child.id
            }
        })

        return NextResponse.json({ success: true, childName: child.name })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
