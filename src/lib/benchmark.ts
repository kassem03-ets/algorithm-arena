
export type BenchmarkResult = {
    medianMs: number;
    meanMs: number;
    minMs: number;
    maxMs: number;
    runs: number;
};

export function benchmark(
    algorithm: () => unknown,
    runs = 100,
    warmups = 10
): BenchmarkResult {
    const BATCH_SIZE = 100;

    // Warm up the JavaScript engine
    for (let i = 0; i < warmups * BATCH_SIZE; i++) {
        algorithm();
    }

    const measurements: number[] = [];

    for (let i = 0; i < runs; i++) {
        const start = performance.now();

        // Measure multiple executions together
        for (let j = 0; j < BATCH_SIZE; j++) {
            algorithm();
        }

        const elapsed = performance.now() - start;

        // Average time per execution
        measurements.push(elapsed / BATCH_SIZE);
    }

    measurements.sort((a, b) => a - b);

    const middle = Math.floor(measurements.length / 2);

    const medianMs =
        measurements.length % 2 === 0
            ? (measurements[middle - 1] + measurements[middle]) / 2
            : measurements[middle];

    const meanMs =
        measurements.reduce((sum, value) => sum + value, 0) /
        measurements.length;

    return {
        medianMs,
        meanMs,
        minMs: measurements[0],
        maxMs: measurements[measurements.length - 1],
        runs: runs * BATCH_SIZE
    };
}
