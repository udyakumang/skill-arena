import { ToneProfile } from './types'

// Quest Structure
export type DailyQuestConfig = {
    warmup: { skillId: string; count: number }
    core: { skillId: string; count: number }
    challenge: { skillId: string; count: number }
}

export type QuestSessionParams = {
    userId: string
    tone: ToneProfile
    ageBand: string
}

// 1. Generate the Daily Plan (The "Director")
export async function generateDailyQuest(): Promise<DailyQuestConfig> {
    // A. Warmup: Find a skill with < 100% stability or recently wrong
    // For MVP: Pick random active skill or default
    const warmupSkill = 'math-add-1'

    // B. Core: The main learning objective (next unlocked skill)
    // For MVP: Hardcoded progression for now
    const coreSkill = 'math-sub-1'

    // C. Challenge: A skill they have mastered but at higher difficulty
    const challengeSkill = 'math-add-1'

    return {
        warmup: { skillId: warmupSkill, count: 5 },
        core: { skillId: coreSkill, count: 10 },
        challenge: { skillId: challengeSkill, count: 5 }
    }
}

// 2. Start Quest Session
// This would be called by the API to create the specific items
export async function startQuestSession() {
    const config = await generateDailyQuest()

    // Create a new session of type 'PRACTICE' or 'QUEST'
    // ... logic to populate DB session items based on config ...
    // This will be implemented in the /api/quest/start route
    return config
}
