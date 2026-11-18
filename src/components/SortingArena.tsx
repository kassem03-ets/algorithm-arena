
"use client";

import { useEffect, useRef, useState } from "react";
import { bubbleSort, type SortStep } from "@/algorithms/sorting/bubbleSort";
import { quickSort } from "@/algorithms/sorting/quickSort";
import { mergeSort } from "@/algorithms/sorting/mergeSort";
import { heapSort } from "@/algorithms/sorting/heapSort";

type SortingAlgorithm =
    | "Bubble Sort"
    | "Quick Sort"
    | "Merge Sort"
    | "Heap Sort";

type Bar = {
    id: number;
    value: number;
};

const ALGORITHMS: SortingAlgorithm[] = [
    "Bubble Sort",
    "Quick Sort",
    "Merge Sort",
    "Heap Sort"
];

let nextBarId = 0;

function createBars(size: number): Bar[] {
    return Array.from({ length: size }, () => ({
        id: nextBarId++,
        value: Math.floor(Math.random() * 90) + 10
    }));
}

function getSteps(
    algorithm: SortingAlgorithm,
    values: number[]
): SortStep[] {
    switch (algorithm) {
        case "Bubble Sort":
            return bubbleSort(values);
        case "Quick Sort":
            return quickSort(values);
        case "Merge Sort":
            return mergeSort(values);
        case "Heap Sort":
            return heapSort(values);
    }
}

function reorderBars(
    previous: Bar[],
    values: number[]
): Bar[] {
    const groups = new Map<number, Bar[]>();

    for (const bar of previous) {
        const group = groups.get(bar.value) ?? [];
        group.push(bar);
        groups.set(bar.value, group);
    }

    return values.map(value => {
        const group = groups.get(value);

        if (group && group.length > 0) {
            return group.shift()!;
        }

        // Merge Sort writes values rather than swapping pairs.
        return {
            id: nextBarId++,
            value
        };
    });
}

function Metric({
                    label,
                    value
                }: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-2 text-xl font-bold text-white">
                {value}
            </p>
        </div>
    );
}

export default function SortingArena() {
    const [algorithm, setAlgorithm] =
        useState<SortingAlgorithm>("Bubble Sort");

    const [arraySize, setArraySize] = useState(15);
    const [bars, setBars] = useState<Bar[]>(() => createBars(15));

    const [comparing, setComparing] = useState<number[]>([]);
    const [moving, setMoving] = useState<number[]>([]);
    const [sorted, setSorted] = useState<number[]>([]);

    const [speedSlider, setSpeedSlider] = useState(35);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const [currentStep, setCurrentStep] = useState(0);
    const [totalSteps, setTotalSteps] = useState(0);
    const [status, setStatus] = useState("Ready to sort");

    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const runId = useRef(0);
    const stepsRef = useRef<SortStep[]>([]);
    const stepIndexRef = useRef(0);
    const barsRef = useRef<Bar[]>(bars);
    const previousValuesRef = useRef(bars.map(bar => bar.value));
    const pausedRef = useRef(false);

    const stepDelay = Math.round(
        1500 - (speedSlider / 100) * 1450
    );

    // Keep the animation timer in sync with slider changes.
    const delayRef = useRef(stepDelay);
    delayRef.current = stepDelay;

    useEffect(() => {
        return () => {
            runId.current++;
            if (timer.current !== null) {
                clearTimeout(timer.current);
            }
        };
    }, []);

    function clearTimer() {
        if (timer.current !== null) {
            clearTimeout(timer.current);
            timer.current = null;
        }
    }

    function stopAnimation() {
        runId.current++;
        clearTimer();
        pausedRef.current = false;
        setIsRunning(false);
        setIsPaused(false);
    }

    function resetVisuals() {
        setComparing([]);
        setMoving([]);
        setSorted([]);
        setCurrentStep(0);
        setTotalSteps(0);
        setStatus("Ready to sort");
    }

    function shuffle(size = arraySize) {
        stopAnimation();

        const next = createBars(size);
        barsRef.current = next;
        previousValuesRef.current = next.map(bar => bar.value);

        setBars(next);
        resetVisuals();
    }

    function changeAlgorithm(value: SortingAlgorithm) {
        stopAnimation();
        setAlgorithm(value);
        resetVisuals();
    }

    function playStep(currentRun: number) {
        if (runId.current !== currentRun || pausedRef.current) {
            return;
        }

        const index = stepIndexRef.current;
        const steps = stepsRef.current;

        if (index >= steps.length) {
            setIsRunning(false);
            setIsPaused(false);
            setComparing([]);
            setMoving([]);
            setStatus("Sorting complete!");
            return;
        }

        const step = steps[index];

        const changed: number[] = [];

        step.array.forEach((value, i) => {
            if (value !== previousValuesRef.current[i]) {
                changed.push(i);
            }
        });

        const nextBars = reorderBars(barsRef.current, step.array);

        barsRef.current = nextBars;
        previousValuesRef.current = [...step.array];

        setBars(nextBars);
        setComparing(step.comparing);
        setMoving(changed);
        setSorted(step.sorted);
        setCurrentStep(index + 1);

        setStatus(
            changed.length > 0
                ? "Moving elements..."
                : step.comparing.length > 0
                    ? "Comparing elements..."
                    : "Sorting..."
        );

        stepIndexRef.current++;

        timer.current = setTimeout(
            () => playStep(currentRun),
            delayRef.current
        );
    }

    function startSorting() {
        if (isRunning) return;

        stopAnimation();

        const initialValues = barsRef.current.map(bar => bar.value);
        const steps = getSteps(algorithm, initialValues);

        if (steps.length === 0) return;

        stepsRef.current = steps;
        stepIndexRef.current = 0;
        previousValuesRef.current = initialValues;

        const currentRun = runId.current;

        pausedRef.current = false;
        setIsRunning(true);
        setIsPaused(false);
        setCurrentStep(0);
        setTotalSteps(steps.length);
        setStatus(`Running ${algorithm}...`);

        playStep(currentRun);
    }

    function togglePause() {
        if (!isRunning) return;

        if (pausedRef.current) {
            pausedRef.current = false;
            setIsPaused(false);
            playStep(runId.current);
        } else {
            pausedRef.current = true;
            clearTimer();
            setIsPaused(true);
            setStatus("Paused");
        }
    }

    const progress =
        totalSteps > 0
            ? (currentStep / totalSteps) * 100
            : 0;

    const positions = new Map<number, number>();

    bars.forEach((bar, index) => {
        positions.set(bar.id, index);
    });

    const permanentBars = [...bars].sort(
        (a, b) => a.id - b.id
    );

    return (
        <div className="space-y-5">
            {/* Unified control card */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        Sorting Arena
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Watch algorithms compare and rearrange elements.
                    </p>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                    <div className="w-full sm:w-56">
                        <label className="mb-2 block text-xs font-medium text-slate-400">
                            Algorithm
                        </label>
                        <select
                            value={algorithm}
                            disabled={isRunning}
                            onChange={e =>
                                changeAlgorithm(
                                    e.target.value as SortingAlgorithm
                                )
                            }
                            className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-white disabled:opacity-50"
                        >
                            {ALGORITHMS.map(item => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => shuffle()}
                        disabled={isRunning}
                        className="h-11 rounded-lg bg-indigo-600 px-5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                        Shuffle Array
                    </button>

                    <button
                        onClick={startSorting}
                        disabled={isRunning}
                        className="h-11 rounded-lg bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                        {isRunning ? "Sorting..." : "Start Sorting"}
                    </button>

                    {isRunning && (
                        <button
                            onClick={togglePause}
                            className="h-11 rounded-lg bg-amber-600 px-5 font-semibold text-white hover:bg-amber-500"
                        >
                            {isPaused ? "Resume" : "Pause"}
                        </button>
                    )}
                </div>

                {/* Same Advanced Settings style as Pathfinding */}
                <details className="group mt-5 border-t border-slate-800 pt-4">
                    <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-slate-400 hover:text-white [&::-webkit-details-marker]:hidden">
            <span className="inline-block text-xs transition-transform group-open:rotate-90">
              ▶
            </span>
                        <span>Advanced Settings</span>
                    </summary>

                    <div className="mt-5 grid grid-cols-1 items-start gap-6 border-t border-slate-800/60 pt-5 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex flex-col">
                            <label className="mb-3 block text-sm text-slate-400">
                                Array Size: {arraySize}
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="60"
                                step="5"
                                value={arraySize}
                                disabled={isRunning}
                                onChange={e => {
                                    const size = Number(e.target.value);
                                    setArraySize(size);
                                    shuffle(size);
                                }}
                                className="h-11 w-full max-w-64 accent-indigo-500"
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Number of bars to sort
                            </p>
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-3 block text-sm text-slate-400">
                                Animation Speed: {stepDelay} ms / step
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={speedSlider}
                                onChange={e =>
                                    setSpeedSlider(Number(e.target.value))
                                }
                                className="h-11 w-full max-w-64 accent-emerald-500"
                            />
                            <div className="flex w-full max-w-64 justify-between text-xs text-slate-500">
                                <span>Slow</span>
                                <span>Fast</span>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <p className="mb-3 text-sm text-slate-400">
                                Visualization
                            </p>
                            <div className="flex h-11 items-center text-sm text-slate-300">
                                Smooth bar movement
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                Comparisons and movements highlighted
                            </p>
                        </div>
                    </div>
                </details>
            </section>

            {/* Visualization card */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-white">
                        Visualization
                    </h3>
                    <span className="text-sm text-emerald-400">
            {status}
          </span>
                </div>

                <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
                    <span>{algorithm}</span>
                    <span>
            Step {currentStep} / {totalSteps}
          </span>
                </div>

                <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                        className="h-full bg-emerald-500 transition-[width] duration-150"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="relative h-[360px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="relative h-full w-full">
                        {permanentBars.map(bar => {
                            const position = positions.get(bar.id) ?? 0;
                            const isMoving = moving.includes(position);
                            const isComparing = comparing.includes(position);
                            const isSorted = sorted.includes(position);

                            const color = isSorted
                                ? "bg-emerald-400"
                                : isMoving
                                    ? "bg-violet-500"
                                    : isComparing
                                        ? "bg-amber-400"
                                        : "bg-cyan-600";

                            const width = 100 / bars.length;

                            return (
                                <div
                                    key={bar.id}
                                    className="absolute bottom-0 flex h-full items-end justify-center"
                                    style={{
                                        left: 0,
                                        width: `${width}%`,
                                        transform: `translateX(${position * 100}%)`,
                                        transition: `transform ${Math.max(
                                            40,
                                            stepDelay * 0.8
                                        )}ms cubic-bezier(0.45, 0, 0.2, 1)`
                                    }}
                                >
                                    <div
                                        className={`w-[85%] rounded-t-md ${color} transition-colors duration-150`}
                                        style={{ height: `${bar.value}%` }}
                                        title={`Value: ${bar.value}`}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
                    <span>🔵 Unsorted</span>
                    <span>🟡 Comparing</span>
                    <span>🟣 Moving</span>
                    <span>🟢 Sorted</span>
                </div>
            </section>

            {/* Statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Metric label="Algorithm" value={algorithm} />
                <Metric label="Array Elements" value={bars.length} />
                <Metric label="Animation Steps" value={currentStep} />
            </div>
        </div>
    );
}
