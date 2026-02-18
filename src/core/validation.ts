import { z } from 'zod'
import { GeneratedContent } from './generator'

// 1. Zod Schema for strict structure validation
export const GeneratedContentSchema = z.object({
    question: z.string().min(1),
    correctAnswer: z.string().min(1),
    distractors: z.array(z.string()).optional(),
    explanation: z.string().optional(),
    hints: z.array(z.string()),
    difficulty: z.number().min(1).max(10), // Hard cap for now
    misconceptionTag: z.string().optional()
})

// 2. Safety / Sanity Checks
export function validateContent(content: GeneratedContent): { valid: boolean, error?: string } {
    // A. Schema Check
    const parse = GeneratedContentSchema.safeParse(content)
    if (!parse.success) {
        return { valid: false, error: parse.error.message }
    }

    // B. Profanity / Safety Filter (Basic Heuristic)
    // Since we generate deterministically from numbers, this is low risk, 
    // but good to have if we expand to word problems.
    const forbidden = ['kill', 'hate', 'stupid', 'dummy']
    const text = (content.question + ' ' + (content.explanation || '')).toLowerCase()
    if (forbidden.some(word => text.includes(word))) {
        return { valid: false, error: "Safety Check Failed: Forbidden terms." }
    }

    // C. Reading Level / Complexity Check
    // E.g. Question shouldn't be too long for a 6-year-old
    if (content.question.length > 150) {
        return { valid: false, error: "Complexity Check Failed: Question too long." }
    }

    // D. Math Truth Check
    const mathCheck = verifyMathStrictness(content)
    if (!mathCheck.valid) {
        return { valid: false, error: mathCheck.error }
    }

    return { valid: true }
}

// 3. Math Correctness Solver (Double-check the generator)
function verifyMathStrictness(content: GeneratedContent): { valid: boolean, error?: string } {
    try {
        // Only validate simple arithmetic formats like "A [op] B = ?"
        const match = content.question.match(/^(\d+)\s*([+\-×÷])\s*(\d+)\s*=\s*\?$/)
        if (!match) return { valid: true } // Skip complex/word problems

        const [, aStr, op, bStr] = match
        const a = parseInt(aStr)
        const b = parseInt(bStr)
        const ans = parseFloat(content.correctAnswer)

        let calculated = 0
        switch (op) {
            case '+': calculated = a + b; break;
            case '-': calculated = a - b; break;
            case '×': calculated = a * b; break;
            case '÷': calculated = a / b; break;
        }

        // Float tolerance for division
        if (Math.abs(calculated - ans) > 0.01) {
            return { valid: false, error: `Math Mismatch: ${content.question} expect ${calculated}, got ${content.correctAnswer}` }
        }

        return { valid: true }
    } catch {
        return { valid: true } // Ignore parser errors for now
    }
}
