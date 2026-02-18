// In-memory mock for dev/test when Upstash is not configured
class MockRedis {
    private store = new Map<string, any>() // eslint-disable-line @typescript-eslint/no-explicit-any

    async get(key: string) { return this.store.get(key) }
    async set(key: string, value: any) { this.store.set(key, value); return 'OK' } // eslint-disable-line @typescript-eslint/no-explicit-any
    async incr(key: string) {
        const val = (this.store.get(key) || 0) + 1
        this.store.set(key, val)
        return val
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async expire(_key: string, _seconds: number) { return 1 }
    async del(key: string) { return this.store.delete(key) }
}

export const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_URL !== "https://mock.upstash.io")
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ? new (require('@upstash/redis').Redis)({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : new MockRedis()

export async function rateLimit(key: string, limit: number, window: number): Promise<boolean> {
    const current = await redis.incr(key)
    if (current === 1) {
        await redis.expire(key, window)
    }
    return current <= limit
}
