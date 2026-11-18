
import type { SortStep } from "./bubbleSort";

export function mergeSort(input: number[]): SortStep[] {
    const array = [...input];
    const steps: SortStep[] = [];

    function record(comparing: number[] = []) {
        steps.push({
            array: [...array],
            comparing,
            sorted: []
        });
    }

    function merge(left: number, middle: number, right: number) {
        const leftArray = array.slice(left, middle + 1);
        const rightArray = array.slice(middle + 1, right + 1);

        let i = 0;
        let j = 0;
        let k = left;

        while (i < leftArray.length && j < rightArray.length) {
            record([left + i, middle + 1 + j]);

            if (leftArray[i] <= rightArray[j]) {
                array[k] = leftArray[i];
                i++;
            } else {
                array[k] = rightArray[j];
                j++;
            }

            record([k]);
            k++;
        }

        while (i < leftArray.length) {
            array[k] = leftArray[i++];
            record([k]);
            k++;
        }

        while (j < rightArray.length) {
            array[k] = rightArray[j++];
            record([k]);
            k++;
        }
    }

    function sort(left: number, right: number) {
        if (left >= right) return;

        const middle = Math.floor((left + right) / 2);

        sort(left, middle);
        sort(middle + 1, right);

        merge(left, middle, right);
    }

    sort(0, array.length - 1);

    steps.push({
        array: [...array],
        comparing: [],
        sorted: array.map((_, index) => index)
    });

    return steps;
}
