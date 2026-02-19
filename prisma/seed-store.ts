import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const COSMETICS = [
    // Avatars
    { sku: 'avatar_robot_base', name: 'Robot Base', type: 'AVATAR', rarity: 'COMMON', coinCost: 100 },
    { sku: 'avatar_wizard_blue', name: 'Blue Wizard', type: 'AVATAR', rarity: 'RARE', coinCost: 500 },
    { sku: 'avatar_dragon_red', name: 'Red Dragon', type: 'AVATAR', rarity: 'EPIC', coinCost: 1500 },
    { sku: 'avatar_king_gold', name: 'Golden King', type: 'AVATAR', rarity: 'LEGENDARY', coinCost: 5000 },

    // Frames
    { sku: 'frame_wood', name: 'Wooden Frame', type: 'FRAME', rarity: 'COMMON', coinCost: 50 },
    { sku: 'frame_silver', name: 'Silver Border', type: 'FRAME', rarity: 'RARE', coinCost: 300 },
    { sku: 'frame_neon', name: 'Neon Glow', type: 'FRAME', rarity: 'EPIC', coinCost: 1000 },

    // Backgrounds
    { sku: 'bg_space', name: 'Deep Space', type: 'BACKGROUND', rarity: 'RARE', coinCost: 400 },
    { sku: 'bg_forest', name: 'Magic Forest', type: 'BACKGROUND', rarity: 'EPIC', coinCost: 1200 },
]

async function main() {
    console.log("Seeding Cosmetics...")
    for (const item of COSMETICS) {
        await prisma.cosmeticItem.upsert({
            where: { sku: item.sku },
            update: item,
            create: item
        })
    }
    console.log("Seeding Complete.")
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
