
import { Division } from '@prisma/client'

export const RATING_BRACKETS = {
    [Division.BRONZE]: { min: 0, max: 1099 },
    [Division.SILVER]: { min: 1100, max: 1299 },
    [Division.GOLD]: { min: 1300, max: 1499 },
    [Division.PLATINUM]: { min: 1500, max: 1699 },
    [Division.DIAMOND]: { min: 1700, max: 1899 },
    [Division.MASTER]: { min: 1900, max: 9999 }
}

export function getDivision(cr: number): Division {
    if (cr >= 1900) return Division.MASTER
    if (cr >= 1700) return Division.DIAMOND
    if (cr >= 1500) return Division.PLATINUM
    if (cr >= 1300) return Division.GOLD
    if (cr >= 1100) return Division.SILVER
    return Division.BRONZE
}

export type PromotionResult = {
    promoted: boolean
    relegated: boolean
    newDivision: Division
    isNewDivision: boolean
}

export function checkPromotion(oldCr: number, newCr: number): PromotionResult {
    const oldDiv = getDivision(oldCr)
    const newDiv = getDivision(newCr)

    // Using enum index might be unsafe if order changes, so we rely on explicit mapping or just string comparison logic if consistent
    // But since order is BRONZE -> MASTER in enum, we can technically compare indices? 
    // Safer to just compare specific transitions or equality.

    // Actually, Prisma enums are just strings at runtime usually, unless using 'const enum' which these aren't.
    // Let's rely on the semantic meaning.

    const isNewDivision = oldDiv !== newDiv

    // Simple logic: If division changed, check if it's "better" or "worse"
    // We can use the min rating to determine "better"
    const oldMin = RATING_BRACKETS[oldDiv].min
    const newMin = RATING_BRACKETS[newDiv].min

    return {
        promoted: isNewDivision && newMin > oldMin,
        relegated: isNewDivision && newMin < oldMin,
        newDivision: newDiv,
        isNewDivision
    }
}
