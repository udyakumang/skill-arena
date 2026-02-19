
import { Division } from '@prisma/client'

export const BADGES = {
    FIRST_WIN: {
        id: 'first_win',
        name: 'First Blood',
        description: 'Win your first ranked match',
        icon: '⚔️'
    },
    STREAK_5: {
        id: 'streak_5',
        name: 'On Fire',
        description: 'Win 5 games in a row',
        icon: '🔥'
    },
    REACH_GOLD: {
        id: 'reach_gold',
        name: 'Gold Standard',
        description: 'Reach Gold Division',
        icon: '🏆'
    },
    XP_100: {
        id: 'xp_100',
        name: 'Veteran',
        description: 'Reach 100 XP',
        icon: '⭐'
    }
}

export type BadgeEvent = {
    type: 'MATCH_WIN' | 'DIVISION_UP' | 'XP_GAIN' | 'STREAK_UPDATE'
    payload: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

// Logic to check unlocking is usually specific, but we can have helper predicates
export function checkBadgeUnlocks(
    userState: {
        wins: number,
        division: Division,
        xp: number,
        winStreak: number,
        existingBadgeIds: string[]
    }
): string[] {
    const unlocked: string[] = []
    const { wins, division, xp, winStreak, existingBadgeIds } = userState

    const has = (id: string) => existingBadgeIds.includes(id)

    // First Win
    if (wins >= 1 && !has(BADGES.FIRST_WIN.id)) {
        unlocked.push(BADGES.FIRST_WIN.id)
    }

    // Streak 5
    if (winStreak >= 5 && !has(BADGES.STREAK_5.id)) {
        unlocked.push(BADGES.STREAK_5.id)
    }

    // Gold
    // Assuming Division enum order or explicit check
    const isGoldOrBetter = ['GOLD', 'PLATINUM', 'DIAMOND', 'MASTER'].includes(division)
    if (isGoldOrBetter && !has(BADGES.REACH_GOLD.id)) {
        unlocked.push(BADGES.REACH_GOLD.id)
    }

    // XP 100
    if (xp >= 100 && !has(BADGES.XP_100.id)) {
        unlocked.push(BADGES.XP_100.id)
    }

    return unlocked
}
