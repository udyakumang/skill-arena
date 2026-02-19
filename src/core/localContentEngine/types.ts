export interface ContentBlueprint {
    id: string
    skillId: string
    difficulty: number // 1-10
    template: string // "What is {{a}} + {{b}}?"
    generator: (seed: number, difficulty: number) => Record<string, any>
    verifier: (params: Record<string, any>) => boolean // Sanity check
    explainer: (params: Record<string, any>) => string
}

export interface GeneratedContent {
    question: string
    options?: string[]
    correctAnswer: string
    explanation: string
    seed: number
    difficulty: number
    blueprintId: string
}

export interface LocalModelProvider {
    generateContent(skillId: string, difficulty: number, seed: number): GeneratedContent
    suggestNextSkill(state: any): { skillId: string, reason: string }
}
