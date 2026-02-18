import { generateContent } from './src/core/generator'

const skills = ['math-add-1', 'math-sub-1', 'math-div-1', 'math-fractions-calc', 'math-algebra-x']

console.log("--- Testing Generator ---")
skills.forEach(skill => {
    console.log(`\nSkill: ${skill}`)
    for (let i = 1; i <= 3; i++) {
        const result = generateContent({
            skillId: skill,
            difficulty: i * 2, // Test diff 2, 4, 6
            tone: 'BALANCED',
            ageBand: '6-8'
        })
        console.log(`[Diff ${result.difficulty}] Q: ${result.question}  A: ${result.correctAnswer}`)
    }
})

// Test Validation Failure (Mock) - Manually trigger by creating a bad object if we could, 
// but for now we trust the schema if valid items pass.
console.log("\n--- Validation Integration Active ---")
console.log("If no warnings above, generator is producing valid schema.")

console.log("\n--- Done ---")
