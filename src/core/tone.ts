import { ToneProfile } from './types'

export type LearnerSignal = {
    frustration: number
    mastery: number
    streak: number
    ageBand: string // "6-8", "9-12"
}

export function selectToneProfile(
    signals: LearnerSignal,
    userPreference: ToneProfile = 'BALANCED'
): ToneProfile {
    // 1. Safety Override: High Frustration -> CALM
    if (signals.frustration > 60) {
        return 'CALM'
    }

    // 2. Momentum Override: High Streak -> HYPE
    if (signals.streak > 5 && userPreference !== 'CALM') {
        return 'HYPE'
    }

    // 3. Default to Preference
    return userPreference
}

export function getFeedbackMessage(result: { isCorrect: boolean, streak: number }, tone: ToneProfile): string {
    if (result.isCorrect) {
        if (tone === 'HYPE') return result.streak > 3 ? "UNSTOPPABLE! 🔥" : "Boom! Correct!"
        if (tone === 'CALM') return "Good job. Steady progress."
        if (tone === 'COMPETITIVE') return `Rank Up! +${result.streak} pts`
        return "Correct!"
    } else {
        if (tone === 'HYPE') return "Oof! Shake it off, try again!"
        if (tone === 'CALM') return "That's tricky. Let's break it down."
        if (tone === 'COMPETITIVE') return "Missed it. Focus!"
        return "Not quite. Try again."
    }
}
