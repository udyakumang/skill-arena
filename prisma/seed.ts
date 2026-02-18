import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding Skill Tree...')

    // 1. Clear existing (optional, for dev)
    // await prisma.skill.deleteMany()

    // 2. Define Skills (Math V1)
    const skills = [
        // Arithmetic Core
        { id: 'math-add-1', slug: 'addition-basic', name: 'Addition (1-10)', topic: 'Arithmetic', tier: 1 },
        { id: 'math-sub-1', slug: 'subtraction-basic', name: 'Subtraction (1-10)', topic: 'Arithmetic', tier: 1 },
        { id: 'math-add-2', slug: 'addition-2digit', name: 'Addition (2-digit)', topic: 'Arithmetic', tier: 2 },
        { id: 'math-mul-1', slug: 'multiplication-tables', name: 'Multiplication Tables', topic: 'Arithmetic', tier: 3 },
        { id: 'math-div-1', slug: 'division-basic', name: 'Division Basics', topic: 'Arithmetic', tier: 3 },

        // Fractions
        { id: 'math-frac-1', slug: 'fractions-intro', name: 'Fractions Intro', topic: 'Fractions', tier: 4 },
        { id: 'math-frac-2', slug: 'fractions-add', name: 'Adding Fractions', topic: 'Fractions', tier: 5 },

        // Algebra Intro
        { id: 'math-alg-1', slug: 'algebra-variables', name: 'Variables & Expressions', topic: 'Algebra', tier: 6 },
    ]

    for (const skill of skills) {
        await prisma.skill.upsert({
            where: { id: skill.id },
            update: {},
            create: skill,
        })
    }

    // 3. Define Prerequisites (The Graph)
    const prereqs = [
        { skillId: 'math-sub-1', prereqId: 'math-add-1' },
        { skillId: 'math-add-2', prereqId: 'math-add-1' },
        { skillId: 'math-mul-1', prereqId: 'math-add-2' },
        { skillId: 'math-div-1', prereqId: 'math-mul-1' },
        { skillId: 'math-frac-1', prereqId: 'math-div-1' },
        { skillId: 'math-frac-2', prereqId: 'math-frac-1' },
        { skillId: 'math-alg-1', prereqId: 'math-frac-2' },
    ]

    for (const p of prereqs) {
        await prisma.skillPrerequisite.upsert({
            where: { skillId_prereqId: { skillId: p.skillId, prereqId: p.prereqId } },
            update: {},
            create: p,
        })
    }

    // 4. Define Content Blueprints (Deterministic Configs)
    // These map to src/core/generator.ts logic (to be implemented)
    const blueprints = [
        {
            skillId: 'math-add-1',
            difficulty: 1,
            generatorId: 'gen_arithmetic_basic',
            params: { operation: 'add', range: [1, 10], terms: 2 }
        },
        {
            skillId: 'math-mul-1',
            difficulty: 1,
            generatorId: 'gen_multiplication_tables',
            params: { range: [1, 12] }
        },
    ]

    for (const bp of blueprints) {
        // Determine a unique ID based on properties to avoid duplicates in seed
        const id = `${bp.skillId}-diff${bp.difficulty}`
        await prisma.contentBlueprint.upsert({
            where: { id },
            update: { params: bp.params },
            create: { id, ...bp },
        })
    }

    console.log('✅ Skill Graph Seeded!')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
