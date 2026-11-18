
export type SortStep = {
    array: number[];
    comparing: number[];
    sorted: number[];
};

export function bubbleSort(input: number[]): SortStep[] {
    const array = [...input];
    const steps: SortStep[] = [];
    const sorted = new Set<number>();

    for (let i = 0; i < array.length - 1; i++) {
        let swapped = false;

        for (let j = 0; j < array.length - i - 1; j++) {
            steps.push({
                array: [...array],
                comparing: [j, j + 1],
                sorted: [...sorted]
            });

            if (array[j] > array[j + 1]) {
                [array[j], array[j + 1]] =
                    [array[j + 1], array[j]];

                swapped = true;

                steps.push({
                    array: [...array],
                    comparing: [j, j + 1],
                    sorted: [...sorted]
                });
            }
        }

        sorted.add(array.length - i - 1);

        if (!swapped) break;
    }

    steps.push({
        array: [...array],
        comparing: [],
        sorted: array.map((_, index) => index)
    });

    return steps;
}
