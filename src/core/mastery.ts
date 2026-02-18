import { MasteryState, SessionItemResult } from './types'

/**
 * Updates the Mastery State based on a single session item result.
 * Implements the "Train-Your-Mind" specific formulas.
 */
export function updateMasteryState(
    currentState: MasteryState,
    result: SessionItemResult
): MasteryState {
    const next = { ...currentState }

    // 1. Update Streak & Stability
    if (result.isCorrect) {
        next.streak += 1
        next.stability += 1
    } else {
        next.streak = 0
        next.stability = Math.max(0, next.stability - 1)
    }

    // 2. Adaptive Difficulty Escalation
    // D = D + (0.3 + 0.05 * S) - (0.2 * H)
    if (result.isCorrect) {
        const increase = 0.3 + (0.05 * next.streak) - (0.2 * result.hintsUsed)
        next.currentDifficulty = Math.max(0, currentState.currentDifficulty + Math.max(0, increase))

        // Update Peak Performance
        if (next.currentDifficulty > next.highestDifficultySolved) {
            next.highestDifficultySolved = next.currentDifficulty
        }
    } else {
        // D = D - 0.5
        next.currentDifficulty = Math.max(0, currentState.currentDifficulty - 0.5)
    }

    // 3. Mastery Score Calculation (0-100)
    // Weighted moving average of recent history + difficulty bonus
    // Simple heuristic for MVP:
    // Base Score = (CurrentDifficulty / 10) * 10 (assuming max diff is ~10?)
    // But user stated 0-100 mastery. Let's assume Difficulty is also roughly 0-10 or 0-100.
    // User Example: Level 1..5. Let's map Level 1->10, 5->50.
    // We'll use a sigmoid-like approach or just direct mapping for transparency.

    // New Formula:
    // Score grows via "XP" from difficulty.
    // Correct Answer:
    //   Delta = (Difficulty * 2) * (1 + Streak/10)
    // Wrong Answer:
    //   Delta = -(Difficulty * 1) 
    //   (Deduct less at lower mastery, more at higher - implemented by logic below)

    let scoreChange = 0
    if (result.isCorrect) {
        // Bonus for no hints
        const hintPenalty = result.hintsUsed * 0.5
        const confidenceBonus = result.timeTakenMs < 5000 ? 1.2 : 1.0

        scoreChange = (Math.max(1, result.difficulty) * 1.5) * confidenceBonus * (1 + next.streak / 10) - hintPenalty
    } else {
        // Penalty scales with mastery.
        // If Mastery > 80 (High), penalty is high (-5).
        // If Mastery < 20 (Low), penalty is low (-1).
        const penaltyFactor = Math.max(1, currentState.score / 20)
        scoreChange = -1 * penaltyFactor * Math.max(1, result.difficulty * 0.5)
    }

    // Frustration Check (Rage clicks or fast failures)
    if (!result.isCorrect && result.timeTakenMs < 2000) {
        next.frustration = Math.min(100, next.frustration + 10)
    } else if (result.isCorrect) {
        next.frustration = Math.max(0, next.frustration - 5)
    }

    next.score = Math.min(100, Math.max(0, currentState.score + scoreChange))

    return next
}

export function checkUnlock(state: MasteryState): boolean {
    // Strict Unlock Rule: Mastery >= 85 AND Stability >= 5 AND Frustration < 50
    // If they are frustrated, they shouldn't advance even if they got lucky.
    return state.score >= 85 && state.stability >= 5 && state.frustration < 50
}

export function getVisibleTier(score: number): 'NOVICE' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'MASTER' {
    if (score >= 95) return 'MASTER'
    if (score >= 85) return 'PLATINUM'
    if (score >= 65) return 'GOLD'
    if (score >= 40) return 'SILVER'
    if (score > 0) return 'BRONZE'
    return 'NOVICE'
}
