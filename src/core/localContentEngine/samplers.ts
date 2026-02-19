export class SeededSampler {
    private seed: number

    constructor(seed: number) {
        this.seed = seed
    }

    // Mulberry32
    private random(): number {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    public range(min: number, max: number): number {
        return Math.floor(this.random() * (max - min + 1)) + min
    }

    public pick<T>(array: T[]): T {
        return array[this.range(0, array.length - 1)]
    }

    public shuffle<T>(array: T[]): T[] {
        const arr = [...array]
        for (let i = arr.length - 1; i > 0; i--) {
            const j = this.range(0, i);
            [arr[i], arr[j]] = [arr[j], arr[i]]
        }
        return arr
    }
}
