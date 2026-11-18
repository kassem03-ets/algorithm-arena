
import type { SortStep } from "./bubbleSort";

export function heapSort(input: number[]): SortStep[] {
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

    function heapify(size: number, root: number) {
        let largest = root;

        const left = 2 * root + 1;
        const right = 2 * root + 2;

        if (left < size) {
            record([left, largest]);

            if (array[left] > array[largest]) {
                largest = left;
            }
        }

        if (right < size) {
            record([right, largest]);

            if (array[right] > array[largest]) {
                largest = right;
            }
        }

        if (largest !== root) {
            [array[root], array[largest]] =
                [array[largest], array[root]];

            record([root, largest]);
            heapify(size, largest);
        }
    }

    // Build max heap
    for (let i = Math.floor(array.length / 2) - 1; i >= 0; i--) {
        heapify(array.length, i);
    }

    // Extract largest elements
    for (let end = array.length - 1; end > 0; end--) {
        [array[0], array[end]] = [array[end], array[0]];

        sorted.add(end);
        record([0, end]);

        heapify(end, 0);
    }

    if (array.length > 0) {
        sorted.add(0);
    }

    record();

    return steps;
}
