import { useState, useCallback } from 'react'
import { selectAnimation, AnimationResponse, AnimationContext } from '@/core/animation'
import { MasteryState, ToneProfile } from '@/core/types'

type UseAnimationComposerProps = {
    masteryState: MasteryState
    tone: ToneProfile
}

export function useAnimationComposer({ masteryState, tone }: UseAnimationComposerProps) {
    const [animation, setAnimation] = useState<AnimationResponse | null>(null)

    const triggerAnimation = useCallback((context: AnimationContext) => {
        const anim = selectAnimation({
            context,
            masteryState,
            tone,
            recentAnimationIds: []
        })
        setAnimation(anim)

        // Auto-clear after 3s
        setTimeout(() => setAnimation(null), 3000)
    }, [masteryState, tone])

    return { animation, triggerAnimation }
}
