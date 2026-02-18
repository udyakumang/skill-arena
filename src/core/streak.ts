export function calculateNewStreak(currentStreak: number, lastPracticeDate: Date | null): number {
    if (!lastPracticeDate) return 1

    const now = new Date()
    // Normalize to midnight UTC to avoid timezone edge cases
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    const last = new Date(Date.UTC(lastPracticeDate.getFullYear(), lastPracticeDate.getMonth(), lastPracticeDate.getDate()))

    const diffTime = Math.abs(today.getTime() - last.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return currentStreak // Already practiced today
    if (diffDays === 1) return currentStreak + 1 // Extended streak
    return 1 // Streak broken
}
