
import { getDivision, checkPromotion, RATING_BRACKETS } from '../core/division'
import { Division } from '@prisma/client'

// Mock Division Enum if not available in environment
const MockDivision = {
    BRONZE: 'BRONZE',
    SILVER: 'SILVER',
    GOLD: 'GOLD',
    PLATINUM: 'PLATINUM',
    DIAMOND: 'DIAMOND',
    MASTER: 'MASTER'
}

describe('Division Logic', () => {

    test('getDivision returns correct division for CR', () => {
        expect(getDivision(1000)).toBe('BRONZE')
        expect(getDivision(1150)).toBe('SILVER')
        expect(getDivision(1350)).toBe('GOLD')
        expect(getDivision(1550)).toBe('PLATINUM')
        expect(getDivision(1750)).toBe('DIAMOND')
        expect(getDivision(2000)).toBe('MASTER')
    })

    test('checkPromotion detects promotion', () => {
        const result = checkPromotion(1090, 1110) // Bronze -> Silver
        expect(result.promoted).toBe(true)
        expect(result.relegated).toBe(false)
        expect(result.newDivision).toBe('SILVER')
    })

    test('checkPromotion detects relegation', () => {
        const result = checkPromotion(1310, 1290) // Gold -> Silver
        expect(result.promoted).toBe(false)
        expect(result.relegated).toBe(true)
        expect(result.newDivision).toBe('SILVER')
    })

    test('checkPromotion ignores fluctuation within same division', () => {
        const result = checkPromotion(1310, 1350) // Gold -> Gold
        expect(result.promoted).toBe(false)
        expect(result.relegated).toBe(false)
        expect(result.isNewDivision).toBe(false)
    })
})
