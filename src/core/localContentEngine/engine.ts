import { ContentBlueprint, GeneratedContent, LocalModelProvider } from "./types";
import { SeededSampler } from "./samplers";
import { MathAdditionBlueprint, MathSubtractionBlueprint } from "./blueprints/mathBasic";

// Registry
const blueprints: Record<string, ContentBlueprint> = {
    [MathAdditionBlueprint.skillId]: MathAdditionBlueprint,
    [MathSubtractionBlueprint.skillId]: MathSubtractionBlueprint
};

export class LocalContentEngine implements LocalModelProvider {

    generateContent(skillId: string, difficulty: number, seed: number): GeneratedContent {
        const blueprint = blueprints[skillId] || MathAdditionBlueprint; // Fallback
        const sampler = new SeededSampler(seed);

        // Generate params
        const params = blueprint.generator(seed, difficulty);

        // Verify
        if (!blueprint.verifier(params)) {
            console.error("Blueprint verification failed", params);
        }

        // Render template
        let question = blueprint.template;
        for (const key in params) {
            question = question.replace(`{{${key}}}`, String(params[key]));
        }

        // Generate Options (simple distractors)
        const correctAnswer = String(params.answer);
        const options = new Set<string>();
        options.add(correctAnswer);

        // Deterministic distractors
        while (options.size < 4) {
            const offset = sampler.range(-5, 5);
            if (offset === 0) continue;
            // Assuming numeric answer for now
            const val = Number(params.answer) + offset;
            if (val >= 0) options.add(String(val));
        }

        return {
            question,
            options: sampler.shuffle(Array.from(options)),
            correctAnswer,
            explanation: blueprint.explainer(params),
            seed,
            difficulty,
            blueprintId: blueprint.id
        };
    }

    suggestNextSkill(state: any): { skillId: string; reason: string; } {
        // Simple heuristic: if win streak > 3, suggest next difficulty or skill
        // For MVP, just return same or 'math-sub-1'
        return {
            skillId: "math-add-1",
            reason: "Keep practicing to build mastery!"
        };
    }
}

export const localEngine = new LocalContentEngine();
