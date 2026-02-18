
import { db } from '@/lib/db'

export type DailyQuestStatus = {
    date: string
    warmup: { skillId: string, completed: boolean }
    challenge: { skillId: string, completed: boolean }
    isComplete: boolean
}

export async function getDailyQuestStatus(userId: string): Promise<DailyQuestStatus> {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // 1. Get or Create User Quest State
    let questState = await db.userQuestState.findUnique({
        where: { userId }
    })

    // Reset if new day
    if (questState && questState.date.toISOString().split('T')[0] !== today) {
        await db.userQuestState.update({
            where: { userId },
            data: {
                date: new Date(),
                warmupDone: false,
                skillDone: false, // Legacy field
                practiceDone: false, // Legacy field
                gameDone: false,
                bonusDone: false
            }
        })
        questState = await db.userQuestState.findUnique({ where: { userId } })
    }

    // Create if missing
    if (!questState) {
        questState = await db.userQuestState.create({
            data: {
                userId,
                date: new Date(),
            }
        })
    }

    // 2. Define Quest Skills (Static for MVP, Dynamic later)
    const warmupSkillId = 'math-add-1'
    const challengeSkillId = 'math-sub-2'

    return {
        date: today,
        warmup: { skillId: warmupSkillId, completed: questState!.warmupDone },
        challenge: { skillId: challengeSkillId, completed: questState!.gameDone },
        isComplete: questState!.warmupDone && questState!.gameDone
    }
}

export async function startQuestSession() {
    // For MVP, just return the static config
    return {
        warmupSkillId: 'math-add-1',
        challengeSkillId: 'math-sub-2'
    }
}
