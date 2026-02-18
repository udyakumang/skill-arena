
export type GameEvent = {
    id: string
    title: string
    description: string
    startDate: string // ISO Date
    endDate: string   // ISO Date
    bonuses: {
        xpMultiplier: number
        dropRateMultiplier: number
    }
}

// Hardcoded events for MVP. In future this comes from DB/Remote Config.
export const EVENTS: GameEvent[] = [
    {
        id: 'launch_week',
        title: 'Launch Celebration',
        description: 'Double XP for all math quests!',
        startDate: '2024-01-01',
        endDate: '2025-12-31', // Long running for testing
        bonuses: {
            xpMultiplier: 2.0,
            dropRateMultiplier: 1.0
        }
    }
]

export function getActiveEvents(): GameEvent[] {
    const now = new Date()
    return EVENTS.filter(e => {
        const start = new Date(e.startDate)
        const end = new Date(e.endDate)
        return now >= start && now <= end
    })
}
