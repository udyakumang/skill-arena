export const BAD_WORDS = [
    'admin', 'root', 'system', 'support',
    'shit', 'fuck', 'damn', 'bitch', 'crap', 'piss', 'dick', 'darn', 'cock', 'pussy', 'ass', 'asshole', 'fag', 'bastard', 'slut', 'douche'
]

export const PII_PATTERNS = [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email
    /\d{3}[-.]?\d{3}[-.]?\d{4}/, // Phone (US-ish)
]

export type SafetyResult = {
    valid: boolean
    reason?: string
    sanitized?: string
}

export function validateString(input: string): SafetyResult {
    if (typeof input !== 'string') {
        return { valid: false, reason: 'Invalid input type' }
    }
    const lower = input.toLowerCase()

    // 1. Check Profanity
    for (const word of BAD_WORDS) {
        if (lower.includes(word)) {
            return { valid: false, reason: 'Contains restricted words' }
        }
    }

    // 2. Check PII
    for (const pattern of PII_PATTERNS) {
        if (pattern.test(input)) {
            return { valid: false, reason: 'PII detected (Email/Phone)' }
        }
    }

    return { valid: true, sanitized: input.trim() }
}
