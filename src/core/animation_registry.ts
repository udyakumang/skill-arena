
// Mock Lottie URLs for now (in potential future we'd have real files)
export const ANIMATION_ASSETS = {
    CHARACTERS: {
        'nod_happy': '/assets/lottie/char_mid_happy.json',
        'fist_pump_fast': '/assets/lottie/char_high_energy.json',
        'gentle_guide': '/assets/lottie/char_supportive.json',
        'confused_scratch': '/assets/lottie/char_confused.json'
    },
    PARTICLES: {
        'sparks_blue': '/assets/lottie/fx_sparks_blue.json',
        'fireworks_gold': '/assets/lottie/fx_fireworks.json',
        'rain_gloomy': '/assets/lottie/fx_rain.json'
    },
    SOUNDS: {
        'chime_tick': '/assets/audio/chime_simple.mp3',
        'orchestra_hit': '/assets/audio/orchestra_hit.mp3',
        'swoosh_fail': '/assets/audio/swoosh_fail.mp3'
    }
}

export const getAssetUrl = (category: 'CHARACTERS' | 'PARTICLES' | 'SOUNDS', id: string) => {
    return ANIMATION_ASSETS[category][id as keyof typeof ANIMATION_ASSETS[typeof category]] || null
}
