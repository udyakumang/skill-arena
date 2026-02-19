// @ts-ignore
import { localEngine } from '../../src/core/localContentEngine/engine'
import { SeededSampler } from '../../src/core/localContentEngine/samplers'
// @ts-ignore
import assert from 'assert'

async function run() {
    console.log('Running Local Content Engine Tests...')

    // SeededSampler
    {
        const seed = 12345
        const sampler1 = new SeededSampler(seed)
        const val1 = sampler1.range(1, 100)
        const val2 = sampler1.range(1, 100)

        const sampler2 = new SeededSampler(seed)
        assert.strictEqual(sampler2.range(1, 100), val1, 'SeededSampler not deterministic (1)')
        assert.strictEqual(sampler2.range(1, 100), val2, 'SeededSampler not deterministic (2)')

        const seed2 = 999
        const arr = [1, 2, 3, 4, 5]
        const s1 = new SeededSampler(seed2)
        const sh1 = s1.shuffle([...arr])
        const s2 = new SeededSampler(seed2)
        const sh2 = s2.shuffle([...arr])

        assert.deepStrictEqual(sh1, sh2, 'Shuffle not deterministic')
        assert.notDeepStrictEqual(sh1, arr, 'Shuffle did not change order (unlikely but possible)')
    }

    // Engine Generation
    {
        const content = localEngine.generateContent('MATH_ADDITION', 1, 101)
        assert.ok(content.question.includes('+'), 'Question should contain +')
        assert.strictEqual(content.options!.length, 4, 'Should have 4 options')
        assert.ok(content.options!.includes(content.correctAnswer), 'Options should include answer')

        const c1 = localEngine.generateContent('MATH_ADDITION', 1, 500)
        const c2 = localEngine.generateContent('MATH_ADDITION', 1, 500)
        assert.deepStrictEqual(c1, c2, 'Content generation not deterministic')

        const c3 = localEngine.generateContent('MATH_ADDITION', 1, 100)
        const c4 = localEngine.generateContent('MATH_ADDITION', 1, 200)
        assert.notDeepStrictEqual(c3.question, c4.question, 'Different seeds should produce different content')
    }

    console.log('✅ Local Engine Tests Passed')
}

run().catch(e => {
    console.error('❌ Test Failed:', e)
    // @ts-ignore
    process.exit(1)
})
