/**
 * Core Rating Engine (ELO-based)
 * 
 * Implements standard ELO rating calculations with dynamic K-factors
 * to support the Ranked Arena's matchmaking and progression.
 */

export const MIN_RATING = 0
export const MAX_RATING = 3000
export const DEFAULT_RATING = 1000

type RatingResult = {
    newRating: number
    ratingChange: number
    expectedScore: number
}

// K-Factor Configuration
// Higher K = more volatility (placement matches)
// Lower K = more stability (masters)
const getKFactor = (rating: number, gamesPlayed: number): number => {
    if (gamesPlayed < 20) return 40 // Placement phase
    if (rating < 2000) return 20    // Standard volatility
    return 10                       // High-tier stability
}

/**
 * Calculates the expected score (win probability) for player A against player B.
 * Returns a value between 0.0 and 1.0.
 */
export function getExpectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

/**
 * Calculates the new rating for a player after a match.
 * 
 * @param currentRating The player's current rating
 * @param opponentRating The opponent's rating (or average of opponents)
 * @param actualScore 1.0 for Win, 0.5 for Draw, 0.0 for Loss
 * @param gamesPlayed Number of ranked games played (affects K-factor)
 */
export function calculateNewRating(
    currentRating: number,
    opponentRating: number,
    actualScore: number,
    gamesPlayed: number = 20 // Default to standard if unknown
): RatingResult {
    const k = getKFactor(currentRating, gamesPlayed)
    const expected = getExpectedScore(currentRating, opponentRating)

    // ELO Formula: R' = R + K * (S - E)
    let change = Math.round(k * (actualScore - expected))

    // Anti-inflation / damping for very high ratings (optional, simplified here)
    // if (currentRating > 2500) change = Math.round(change * 0.8)

    let newRating = currentRating + change

    // Clamp boundaries
    newRating = Math.max(MIN_RATING, Math.min(newRating, MAX_RATING))
    change = newRating - currentRating

    return {
        newRating,
        ratingChange: change,
        expectedScore: expected
    }
}
