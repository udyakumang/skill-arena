export type MasteryState = {
    score: number           // 0-100
    stability: number       // Consecutive successes
    frustration: number     // 0-100
    confidence: number      // 0-100
    streak: number
    currentDifficulty: number
    highestDifficultySolved: number
    history: {
        result: 'CORRECT' | 'WRONG'
        difficulty: number
        timestamp: number
    }[]
}

export type SkillItem = {
    id: string
    difficulty: number
    misconceptionId?: string
}

export type SessionItemResult = {
    isCorrect: boolean
    timeTakenMs: number
    hintsUsed: number
    difficulty: number
}

export type ToneProfile = 'CALM' | 'BALANCED' | 'HYPE' | 'COMPETITIVE'
