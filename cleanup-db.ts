import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log("Dropping Region table and type if they exist...")
        // Drop table first, then type to avoid dependency issues
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Region" CASCADE;`)
        await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "Region" CASCADE;`)
        console.log("Cleanup complete.")
    } catch (e) {
        console.error("Cleanup failed:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
