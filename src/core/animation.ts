import { MasteryState, ToneProfile } from './types'
import { getAssetUrl } from './animation_registry'

export type AnimationRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
export type AnimationContext = 'CORRECT' | 'WRONG' | 'STREAK_5' | 'TIER_UP' | 'UNLOCK'

export type AnimationRequest = {
    context: AnimationContext
    masteryState: MasteryState
    tone: ToneProfile
    recentAnimationIds: string[] // IDs to exclude
}

export type AnimationResponse = {
    id: string
    rarity: AnimationRarity
    layers: {
        character: string
        characterUrl: string | null
        particle: string
        particleUrl: string | null
        sound: string
        soundUrl: string | null
        ui: string
    }
}

/**
 * Selects the best animation based on Context, Rarity, and Cooldowns.
 * Implements "Anti-Repetition" and "Emotional Adaptation".
 */
export function selectAnimation(req: AnimationRequest): AnimationResponse {
    const { context, masteryState } = req

    // 1. Determine Target Rarity
    // Default: Common (70%), Rare (25%), Epic (5%) - simple weighted random
    let rarity: AnimationRarity = 'COMMON'
    const roll = Math.random()

    if (context === 'UNLOCK' || context === 'TIER_UP') {
        rarity = 'LEGENDARY'
    } else if (masteryState.streak > 10 && roll > 0.9) {
        rarity = 'EPIC'
    } else if (masteryState.streak > 5 && roll > 0.7) {
        rarity = 'RARE'
    }

    // 2. Determine Emotional State (Flow vs Struggle)
    const isFlow = masteryState.streak > 3 && masteryState.confidence > 70
    const isStruggling = masteryState.stability === 0 && masteryState.history.slice(-3).every(h => h.result === 'WRONG')

    // 3. Compose Layers (Mocking the ID selection logic)
    // In a real app, this would query a config/DB of available assets
    const id = `anim_${context.toLowerCase()}_${rarity.toLowerCase()}_${Date.now()}`

    let characterAnim = 'nod_happy'
    if (isFlow) characterAnim = 'fist_pump_fast'
    if (isStruggling) characterAnim = 'gentle_guide'

    return {
        id,
        rarity,
        layers: {
            character: characterAnim,
            characterUrl: getAssetUrl('CHARACTERS', characterAnim),
            particle: rarity === 'LEGENDARY' ? 'fireworks_gold' : (isFlow ? 'sparks_blue' : 'none'),
            particleUrl: getAssetUrl('PARTICLES', rarity === 'LEGENDARY' ? 'fireworks_gold' : (isFlow ? 'sparks_blue' : 'none')),
            sound: rarity === 'LEGENDARY' ? 'orchestra_hit' : 'chime_tick',
            soundUrl: getAssetUrl('SOUNDS', rarity === 'LEGENDARY' ? 'orchestra_hit' : 'chime_tick'),
            ui: isFlow ? 'flash_border_gold' : 'pulse_green'
        }
    }
}
