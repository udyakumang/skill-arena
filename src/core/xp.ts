
export const XP_EVENTS = {
    PRACTICE_WIN: 5,
    RANKED_WIN: 15,
    DAILY_CHALLENGE_COMPLETE: 20
}

export function calculateLevel(xp: number): number {
    return Math.floor(xp / 100) + 1
}

export function getNextLevelProgress(xp: number): { current: number, total: number, percent: number } {
    const level = calculateLevel(xp)
    const currentLevelXp = (level - 1) * 100
    const nextLevelXp = level * 100
    const progress = xp - currentLevelXp

    return {
        current: progress,
        total: 100,
        percent: (progress / 100) * 100
    }
}
