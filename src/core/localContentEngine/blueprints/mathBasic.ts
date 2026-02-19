import { ContentBlueprint } from "../types";
import { SeededSampler } from "../samplers";

export const MathAdditionBlueprint: ContentBlueprint = {
    id: "math-addition-basic",
    skillId: "math-add-1", // Maps to DB Access
    difficulty: 1,
    template: "What is {{a}} + {{b}}?",
    generator: (seed, difficulty) => {
        const sampler = new SeededSampler(seed);
        const max = difficulty * 5;
        const a = sampler.range(1, max);
        const b = sampler.range(1, max);
        return { a, b, answer: a + b };
    },
    verifier: (params) => params.answer === params.a + params.b,
    explainer: (params) => `To add ${params.a} and ${params.b}, count forward from ${params.a} by ${params.b} steps.`
}

export const MathSubtractionBlueprint: ContentBlueprint = {
    id: "math-subtraction-basic",
    skillId: "math-sub-1",
    difficulty: 1,
    template: "What is {{a}} - {{b}}?",
    generator: (seed, difficulty) => {
        const sampler = new SeededSampler(seed);
        const max = difficulty * 5;
        const b = sampler.range(1, max);
        const answer = sampler.range(1, max);
        const a = b + answer; // Ensure positive result
        return { a, b, answer };
    },
    verifier: (params) => params.answer === params.a - params.b,
    explainer: (params) => `To subtract ${params.b} from ${params.a}, count backwards from ${params.a} by ${params.b} steps.`
}
