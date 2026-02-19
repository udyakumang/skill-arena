import { db } from '@/lib/db'

export async function checkIdempotency(userId: string, key: string, route: string): Promise<boolean> {
    const existing = await db.idempotencyKey.findUnique({
        where: {
            userId_key_route: {
                userId,
                key,
                route
            }
        }
    })

    if (existing) return false // Already processed

    await db.idempotencyKey.create({
        data: {
            userId,
            key,
            route
        }
    })

    return true // New request
}
