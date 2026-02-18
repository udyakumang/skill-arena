import { calculateNewRating } from './src/core/rating'

console.log("--- ELO Rating Validation ---\n")

const cases = [
    { p1: 1000, p2: 1000, score: 1, desc: "Equal rating, P1 wins" },
    { p1: 1000, p2: 1000, score: 0, desc: "Equal rating, P1 loses" },
    { p1: 1000, p2: 1000, score: 0.5, desc: "Equal rating, Draw" },
    { p1: 1200, p2: 1000, score: 1, desc: "High rating vs Low rating, High wins (Expected)" },
    { p1: 1200, p2: 1000, score: 0, desc: "High rating vs Low rating, High loses (Upset)" },
    { p1: 1000, p2: 2000, score: 1, desc: "Low vs Grandmaster, Low wins (Huge Upset)" },
]

cases.forEach(c => {
    const result = calculateNewRating(c.p1, c.p2, c.score, 20)
    console.log(`Case: ${c.desc}`)
    console.log(`  P1: ${c.p1} vs P2: ${c.p2}`)
    console.log(`  Result: ${c.score} (Expected: ${result.expectedScore.toFixed(2)})`)
    console.log(`  Change: ${result.ratingChange > 0 ? '+' : ''}${result.ratingChange} -> New: ${result.newRating}`)
    console.log("---------------------------------------------------")
})
