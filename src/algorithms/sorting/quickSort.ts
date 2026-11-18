
import type { SortStep } from "./bubbleSort";

export function quickSort(input: number[]): SortStep[] {
    const array = [...input];
    const steps: SortStep[] = [];
    const sorted = new Set<number>();

    function record(comparing: number[] = []) {
        steps.push({
            array: [...array],
            comparing,
            sorted: [...sorted]
        });
    }

    function partition(low: number, high: number): number {
        const pivot = array[high];
        let i = low;

        for (let j = low; j < high; j++) {
            record([j, high]);

            if (array[j] < pivot) {
                [array[i], array[j]] = [array[j], array[i]];
                record([i, j]);
                i++;
            }
        }

        [array[i], array[high]] = [array[high], array[i]];
        sorted.add(i);
        record([i, high]);

        return i;
    }

    function sort(low: number, high: number) {
        if (low > high) return;

        if (low === high) {
            sorted.add(low);
            record();
            return;
        }

        const pivotIndex = partition(low, high);

        sort(low, pivotIndex - 1);
        sort(pivotIndex + 1, high);
    }

    sort(0, array.length - 1);

    record();

    return steps;
}
