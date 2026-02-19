import { ToneProfile } from './types'
import { validateContent } from './validation'

export type GeneratedContent = {
    question: string
    correctAnswer: string
    distractors?: string[]
    explanation?: string
    hints: string[]
    difficulty: number
    misconceptionTag?: string
}

export type GeneratorParams = {
    skillId: string
    difficulty: number
    tone: ToneProfile
    ageBand: string // "6-8", "9-12"
    seed?: string // NEW: Seed for deterministic generation
}

// Simple LCG Helper
class RNG {
    private state: number
    constructor(seed?: string) {
        if (seed) {
            let h = 0xdeadbeef
            for (let i = 0; i < seed.length; i++) {
                h = Math.imul(h ^ seed.charCodeAt(i), 2654435761);
            }
            this.state = (h ^ h >>> 16) >>> 0;
        } else {
            this.state = Math.floor(Math.random() * 4294967296)
        }
    }

    next(): number {
        this.state = (this.state * 1664525 + 1013904223) % 4294967296
        return this.state / 4294967296
    }
}

// Helper: Random Int
const rand = (min: number, max: number, rng: RNG) => Math.floor(rng.next() * (max - min + 1)) + min
// Helper: Random Item
const pick = <T>(arr: T[], rng: RNG) => arr[Math.floor(rng.next() * arr.length)]

type GenFunc = (diff: number, rng: RNG) => GeneratedContent

const GENERATORS: Record<string, GenFunc> = {
    // --- ADDITION ---
    'math-add-1': (diff, rng) => {
        const max = 5 + diff * 2
        const a = rand(1, max, rng)
        const b = rand(1, max, rng)
        const ans = a + b
        return {
            question: `${a} + ${b} = ?`,
            correctAnswer: ans.toString(),
            distractors: [ans + 1, ans - 1, ans + 2].map(String),
            hints: [`Start at ${a} and count up ${b}`, `Combine the two numbers`],
            difficulty: diff,
            explanation: `${a} plus ${b} equals ${ans}.`
        }
    },

    // --- SUBTRACTION ---
    'math-sub-1': (diff, rng) => {
        const max = 5 + diff * 2
        const a = rand(2, max + 5, rng)
        const b = rand(1, a - 1, rng)
        const ans = a - b
        return {
            question: `${a} - ${b} = ?`,
            correctAnswer: ans.toString(),
            hints: [`Take ${b} away from ${a}`, `Count backwards from ${a}`],
            difficulty: diff
        }
    },

    // --- MULTIPLICATION ---
    'math-mul-1': (diff, rng) => {
        // Levels: 2,5,10 -> 3,4 -> 6,7,8,9 -> 11,12
        const levels = [
            [2, 5, 10],
            [2, 3, 4, 5, 10],
            [2, 3, 4, 5, 6, 7, 8, 9, 10],
            [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        ]
        const tables = levels[Math.min(diff - 1, 3)] || levels[0]
        const a = pick(tables, rng)
        const b = rand(1, 10 + Math.floor(diff / 2), rng)
        const ans = a * b
        return {
            question: `${a} × ${b} = ?`,
            correctAnswer: ans.toString(),
            hints: [`${b} groups of ${a}`, `Skip count by ${a}`],
            difficulty: diff
        }
    },

    // --- DIVISION (New) ---
    'math-div-1': (diff, rng) => {
        // Inverse multiplication to ensure integers
        const tables = [2, 5, 10, 3, 4] // Basic divisors
        const divisor = pick(tables, rng)
        const quotient = rand(1, 10, rng)
        const dividend = divisor * quotient
        return {
            question: `${dividend} ÷ ${divisor} = ?`,
            correctAnswer: quotient.toString(),
            hints: [`How many ${divisor}s go into ${dividend}?`, `Think: ? × ${divisor} = ${dividend}`],
            difficulty: diff
        }
    },

    // --- FRACTIONS (New) ---
    'math-fractions-calc': (diff, rng) => {
        // Simple same-denominator addition
        const denom = pick([2, 3, 4, 5, 6, 8, 10], rng)
        const num1 = rand(1, denom - 1, rng)
        const num2 = rand(1, denom - num1, rng) // Keep sum <= 1 for simplicity mostly, or allow improper
        // Let's keep it simple: sum < denom usually implies result < 1
        const ansNum = num1 + num2
        return {
            question: `${num1}/${denom} + ${num2}/${denom} = ?`,
            correctAnswer: `${ansNum}/${denom}`,
            distractors: [`${num1 + num2}/${denom * 2}`, `${Math.abs(num1 - num2)}/${denom}`],
            hints: [`Keep the bottom number (${denom}) the same`, `Add the top numbers`],
            difficulty: diff
        }
    },

    // --- ALGEBRA (New) ---
    'math-algebra-x': (diff, rng) => {
        // x + a = b
        const a = rand(1, 10 + diff, rng)
        const x = rand(1, 10 + diff, rng)
        const b = a + x
        return {
            question: `x + ${a} = ${b}. What is x?`,
            correctAnswer: x.toString(),
            hints: [`Opposite of +${a} is -${a}`, `Subtract ${a} from ${b}`],
            difficulty: diff
        }
    }
}

export function generateContent(params: GeneratorParams): GeneratedContent {
    const rng = new RNG(params.seed)

    let gen = GENERATORS[params.skillId]
    if (!gen) {
        // Fallback or fuzzy match
        if (params.skillId.startsWith('math-add')) gen = GENERATORS['math-add-1']
        else if (params.skillId.startsWith('math-sub')) gen = GENERATORS['math-sub-1']
        else if (params.skillId.startsWith('math-mul')) gen = GENERATORS['math-mul-1']
        else {
            return {
                question: `Mock Question for ${params.skillId}`,
                correctAnswer: "1",
                hints: ["This is a mock hint"],
                difficulty: params.difficulty
            }
        }
    }

    // Pass RNG to generator
    const content = gen(params.difficulty, rng)

    const valid = validateContent(content)
    if (!valid.valid) {
        console.warn("Content validation failed:", valid.error, content)
        // Fallback or retry logic could go here
    }
    return content
}
