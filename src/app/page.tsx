"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { bfs } from "@/algorithms/bfs";
import { dfs } from "@/algorithms/dfs";
import { dijkstra } from "@/algorithms/dijkstra";
import { astar } from "@/algorithms/astar";

import { benchmark, type BenchmarkResult } from "@/lib/benchmark";
import { generateMaze, type MazeType } from "@/lib/maze";

import SortingArena from "@/components/SortingArena";
import SearchingArena from "@/components/SearchingArena";

type Algorithm = "A*" | "Dijkstra" | "BFS" | "DFS";
type Mode = "single" | "race";
type Arena = "home" | "pathfinding" | "sorting" | "searching";

type SearchResult = {
    visitedOrder: number[];
    path: number[];
};

type RaceState = {
    visited: Set<number>;
    path: Set<number>;
    explored: number;
    result: SearchResult | null;
    computationMs: number | null;
    status: string;
};

const ROWS = 20;
const COLS = 35;
const START = 10 * COLS + 5;
const TARGET = 10 * COLS + 29;

const ALGORITHMS: Algorithm[] = [
    "A*",
    "Dijkstra",
    "BFS",
    "DFS"
];

function emptyRaceState(): RaceState {
    return {
        visited: new Set(),
        path: new Set(),
        explored: 0,
        result: null,
        computationMs: null,
        status: "Ready"
    };
}

function runSearch(
    algorithm: Algorithm,
    walls: Set<number>
): SearchResult {
    switch (algorithm) {
        case "BFS":
            return bfs(ROWS, COLS, START, TARGET, walls);
        case "DFS":
            return dfs(ROWS, COLS, START, TARGET, walls);
        case "Dijkstra":
            return dijkstra(ROWS, COLS, START, TARGET, walls);
        case "A*":
            return astar(ROWS, COLS, START, TARGET, walls);
    }
}

function measureSearch(selected: Algorithm, walls: Set<number>) {
    const startTime = performance.now();
    const result = runSearch(selected, walls);
    const computationMs = performance.now() - startTime;

    return { result, computationMs };
}

function algorithmLabel(algorithm: Algorithm): string {
    switch (algorithm) {
        case "A*":
            return "A* Search";
        case "BFS":
            return "Breadth-First Search";
        case "DFS":
            return "Depth-First Search";
        case "Dijkstra":
            return "Dijkstra";
    }
}

function AlgorithmSelect({
                             value,
                             onChange,
                             disabled
                         }: {
    value: Algorithm;
    onChange: (value: Algorithm) => void;
    disabled: boolean;
}) {
    return (
        <select
            value={value}
            disabled={disabled}
            onChange={e =>
                onChange(e.target.value as Algorithm)
            }
            className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
        >
            {ALGORITHMS.map(item => (
                <option key={item} value={item}>
                    {algorithmLabel(item)}
                </option>
            ))}
        </select>
    );
}

function Grid({
                  walls,
                  visited,
                  path,
                  disabled,
                  onCellClick,
                  compact = false
              }: {
    walls: Set<number>;
    visited: Set<number>;
    path: Set<number>;
    disabled: boolean;
    onCellClick: (index: number) => void;
    compact?: boolean;
}) {
    return (
        <div className="w-full overflow-x-auto">
            <div
                className={`mx-auto grid w-full ${
    compact
        ? "max-w-[700px]"
        : "max-w-[1050px]"
}`}
                style={{
                    gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                    gap: compact ? "2px" : "3px"
                }}
            >
                {Array.from(
                    { length: ROWS * COLS },
                    (_, index) => {
                        const color =
                            index === START
                                ? "bg-emerald-400"
                                : index === TARGET
                                    ? "bg-rose-400"
                                    : walls.has(index)
                                        ? "bg-slate-500"
                                        : path.has(index)
                                            ? "bg-amber-400"
                                            : visited.has(index)
                                                ? "bg-cyan-600"
                                                : "bg-slate-800 hover:bg-slate-700";

                        return (
                            <button
                                key={index}
                                type="button"
                                disabled={disabled}
                                onClick={() => onCellClick(index)}
                                aria-label={`Grid cell ${index}`}
                                className={`aspect-square min-w-0 rounded-[2px] ${color}`}
                            />
                        );
                    }
                )}
            </div>
        </div>
    );
}

function StatCard({
                      label,
                      value
                  }: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">
                {label}
            </p>

            <p className="mt-2 text-xl font-bold text-white">
                {value}
            </p>
        </div>
    );
}

function GridLegend() {
    const items = [
        { label: "Start", color: "bg-emerald-400" },
        { label: "Target", color: "bg-rose-400" },
        { label: "Wall", color: "bg-slate-500" },
        { label: "Visited", color: "bg-cyan-600" },
        { label: "Path", color: "bg-amber-400" }
    ];

    return (
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
            {items.map(item => (
                <div
                    key={item.label}
                    className="flex items-center gap-2"
                >
          <span
              className={`h-3 w-3 rounded-[2px] ${item.color}`}
          />
                    <span>{item.label}</span>
                </div>
            ))}
        </div>
    );
}

function SearchProgress({
                            algorithm,
                            state
                        }: {
    algorithm: Algorithm;
    state: RaceState;
}) {
    const total =
        state.result?.visitedOrder.length ?? 0;

    const progress =
        total > 0
            ? Math.min(100, (state.explored / total) * 100)
            : 0;

    return (
        <>
            <div className="mb-4 flex items-center justify-between gap-3 text-xs text-slate-400">
                <span>{algorithmLabel(algorithm)}</span>

                <span className="tabular-nums">
          {state.explored} / {total} nodes
        </span>
            </div>

            <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                    className="h-full bg-emerald-500 transition-[width] duration-150"
                    style={{
                        width: `${progress}%`
                    }}
                />
            </div>
        </>
    );
}

function RacePanel({
                       title,
                       algorithm,
                       onAlgorithmChange,
                       state,
                       walls,
                       isRunning,
                       onCellClick
                   }: {
    title: string;
    algorithm: Algorithm;
    onAlgorithmChange: (value: Algorithm) => void;
    state: RaceState;
    walls: Set<number>;
    isRunning: boolean;
    onCellClick: (index: number) => void;
}) {
    return (
        <section className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                        {title}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                        {state.status}
                    </p>
                </div>

                <div className="w-full sm:w-56">
                    <AlgorithmSelect
                        value={algorithm}
                        disabled={isRunning}
                        onChange={onAlgorithmChange}
                    />
                </div>
            </div>

            <SearchProgress
                algorithm={algorithm}
                state={state}
            />

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <Grid
                    walls={walls}
                    visited={state.visited}
                    path={state.path}
                    disabled={isRunning}
                    onCellClick={onCellClick}
                    compact
                />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
                <StatCard
                    label="Explored"
                    value={state.explored}
                />

                <StatCard
                    label="Path Length"
                    value={
                        state.result
                            ? state.result.path.length > 0
                                ? state.result.path.length - 1
                                : "No path"
                            : "—"
                    }
                />

                <StatCard
                    label="Compute Time"
                    value={
                        state.computationMs !== null
                            ? `${state.computationMs.toFixed(3)} ms`
                            : "—"
                    }
                />
            </div>
        </section>
    );
}

function RaceResults({
                         leftAlgorithm,
                         rightAlgorithm,
                         leftState,
                         rightState
                     }: {
    leftAlgorithm: Algorithm;
    rightAlgorithm: Algorithm;
    leftState: RaceState;
    rightState: RaceState;
}) {
    const left = leftState.result;
    const right = rightState.result;

    if (!left || !right) return null;

    const leftFound = left.path.length > 0;
    const rightFound = right.path.length > 0;

    const leftNodes = left.visitedOrder.length;
    const rightNodes = right.visitedOrder.length;

    let winner = "Tie";
    let explanation =
        "Both explored the same number of nodes.";

    if (leftFound && !rightFound) {
        winner = leftAlgorithm;
        explanation = "Only this algorithm found a path.";
    } else if (!leftFound && rightFound) {
        winner = rightAlgorithm;
        explanation = "Only this algorithm found a path.";
    } else if (!leftFound && !rightFound) {
        winner = "No winner";
        explanation = "Neither algorithm found a path.";
    } else if (leftNodes < rightNodes) {
        winner = leftAlgorithm;
        explanation =
            `${leftNodes} nodes explored vs. ${rightNodes}.`;
    } else if (rightNodes < leftNodes) {
        winner = rightAlgorithm;
        explanation =
            `${rightNodes} nodes explored vs. ${leftNodes}.`;
    }

    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                Search Efficiency Winner
            </p>

            <h3 className="mt-2 text-2xl font-bold">
                {winner === "Tie" || winner === "No winner"
                    ? winner
                    : `${winner} wins!`}
            </h3>

            <p className="mt-2 text-sm text-slate-400">
                {explanation}
            </p>

            <p className="mt-3 text-xs text-slate-500">
                Winner determined by nodes explored,
                not animation speed.
            </p>
        </section>
    );
}

function BenchmarkPanel({
                            leftAlgorithm,
                            rightAlgorithm,
                            walls,
                            disabled
                        }: {
    leftAlgorithm: Algorithm;
    rightAlgorithm: Algorithm;
    walls: Set<number>;
    disabled: boolean;
}) {
    const [leftBenchmark, setLeftBenchmark] =
        useState<BenchmarkResult | null>(null);

    const [rightBenchmark, setRightBenchmark] =
        useState<BenchmarkResult | null>(null);

    const [benchmarking, setBenchmarking] =
        useState(false);
    

    function runBenchmark() {
        if (disabled || benchmarking) return;

        setBenchmarking(true);

        setTimeout(() => {
            try {
                const left = benchmark(
                    () => runSearch(leftAlgorithm, walls),
                    100,
                    10
                );

                const right = benchmark(
                    () => runSearch(rightAlgorithm, walls),
                    100,
                    10
                );

                setLeftBenchmark(left);
                setRightBenchmark(right);
            } finally {
                setBenchmarking(false);
            }
        }, 50);
    }

    const fastest =
        leftBenchmark && rightBenchmark
            ? leftBenchmark.medianMs <
            rightBenchmark.medianMs
                ? leftAlgorithm
                : rightBenchmark.medianMs <
                leftBenchmark.medianMs
                    ? rightAlgorithm
                    : "Tie"
            : null;

    return (
        <details className="group rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold [&::-webkit-details-marker]:hidden">
        <span className="text-xs transition-transform group-open:rotate-90">
          ▶
        </span>

                Performance Benchmark

                <span className="ml-2 text-xs font-normal text-slate-400">
          Optional
        </span>
            </summary>

            <div className="mt-5 border-t border-slate-800 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm text-slate-400">
                        Compare median execution times over repeated runs.
                    </p>

                    <button
                        onClick={runBenchmark}
                        disabled={disabled || benchmarking}
                        className="h-11 rounded-lg bg-indigo-600 px-5 font-semibold hover:bg-indigo-500 disabled:opacity-50"
                    >
                        {benchmarking
                            ? "Benchmarking..."
                            : "Run Benchmark"}
                    </button>
                </div>

                {leftBenchmark && rightBenchmark && (
                    <>
                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {[
                                {
                                    name: leftAlgorithm,
                                    data: leftBenchmark
                                },
                                {
                                    name: rightAlgorithm,
                                    data: rightBenchmark
                                }
                            ].map((item, index) => (
                                <div
                                    key={index}
                                    className="rounded-xl border border-slate-700 bg-slate-800 p-5"
                                >
                                    <h4 className="font-bold">
                                        {item.name}
                                    </h4>

                                    <p className="mt-3 text-xs text-slate-400">
                                        Median Execution
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-emerald-400">
                                        {item.data.medianMs.toFixed(4)} ms
                                    </p>

                                    <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                                        <div>
                                            <p className="text-slate-400">
                                                Mean
                                            </p>
                                            <p>
                                                {item.data.meanMs.toFixed(4)} ms
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-slate-400">
                                                Min
                                            </p>
                                            <p>
                                                {item.data.minMs.toFixed(4)} ms
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-slate-400">
                                                Max
                                            </p>
                                            <p>
                                                {item.data.maxMs.toFixed(4)} ms
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mt-3 text-xs text-slate-500">
                                        {item.data.runs.toLocaleString()} runs
                                    </p>
                                </div>
                            ))}
                        </div>

                        <p className="mt-5 text-sm text-slate-300">
                            Fastest median:{" "}
                            <strong>{fastest}</strong>
                        </p>
                    </>
                )}
            </div>
        </details>
    );
}

function HomeDashboard({ onOpen }: { onOpen: (arena: Arena) => void }) {
    const cards = [
        {
            id: "pathfinding" as const,
            number: "01",
            title: "Pathfinding",
            description: "Watch graph algorithms explore a grid, navigate obstacles, and discover routes.",
            algorithms: "A* · Dijkstra · BFS · DFS",
            accent: "text-emerald-400",
            border: "hover:border-emerald-500/60",
            symbol: "↗"
        },
        {
            id: "sorting" as const,
            number: "02",
            title: "Sorting",
            description: "See how different strategies organize data, step by step.",
            algorithms: "Bubble · Quick · Merge · Heap",
            accent: "text-sky-400",
            border: "hover:border-sky-500/60",
            symbol: "▥"
        },
        {
            id: "searching" as const,
            number: "03",
            title: "String Searching",
            description: "Explore pattern matching in text, including clever ways to skip unnecessary comparisons.",
            algorithms: "Naive · KMP · Boyer–Moore · Rabin–Karp",
            accent: "text-violet-400",
            border: "hover:border-violet-500/60",
            symbol: "⌕"
        }
    ];

    return (
        <div className="space-y-7">
            <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 px-6 py-12 md:px-12 md:py-16">
                <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-36 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="relative max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">Learn by seeing</p>
                    <h2 className="mt-5 text-4xl font-bold tracking-tight text-white md:text-6xl">
                        Algorithms, <span className="text-emerald-400">brought to life.</span>
                    </h2>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">
                        An interactive playground for exploring how algorithms work. Visualize every step, experiment with inputs, and compare approaches side by side.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <button type="button" onClick={() => onOpen("pathfinding")} className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-500">
                            Explore an arena <span aria-hidden="true">→</span>
                        </button>
                        <a href="https://github.com/kassem03-ets/algorithm-arena" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-700 bg-slate-800/70 px-6 py-3 font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800">
                            View on GitHub <span aria-hidden="true">↗</span>
                        </a>
                    </div>
                    <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-slate-800 pt-7">
                        {[
                            { value: "3", label: "Interactive arenas" },
                            { value: "12", label: "Algorithms" },
                            { value: "2", label: "Visualization modes" }
                        ].map(stat => (
                            <div key={stat.label}>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="mt-1 text-xs text-slate-400">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section aria-labelledby="arenas-heading">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Choose your challenge</p>
                        <h3 id="arenas-heading" className="mt-2 text-2xl font-bold text-white">Explore the arenas</h3>
                    </div>
                    <p className="text-sm text-slate-500">Select an arena to get started</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {cards.map(card => (
                        <button key={card.id} type="button" onClick={() => onOpen(card.id)} className={`group flex min-h-64 flex-col rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left transition duration-200 hover:-translate-y-1 hover:bg-slate-800/80 ${card.border}`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold tracking-widest text-slate-500">ARENA {card.number}</span>
                                <span aria-hidden="true" className={`text-3xl ${card.accent}`}>{card.symbol}</span>
                            </div>
                            <h4 className="mt-7 text-xl font-bold text-white">{card.title}</h4>
                            <p className="mt-3 flex-1 text-sm leading-6 text-slate-400">{card.description}</p>
                            <p className="mt-5 text-xs leading-5 text-slate-500">{card.algorithms}</p>
                            <div className={`mt-5 text-sm font-semibold ${card.accent}`}>Open arena <span className="inline-block transition-transform group-hover:translate-x-1">→</span></div>
                        </button>
                    ))}
                </div>
            </section>
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
                <h3 className="text-lg font-semibold text-white">Experiment. Visualize. Compare.</h3>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
                    Customize inputs, adjust animation speed, and use Race Mode to compare algorithms on the same problem. Pathfinding also includes maze generation and an optional performance benchmark.
                </p>
            </section>
        </div>
    );
}

export default function Home() {
    const [arena, setArena] =
        useState<Arena>("home");

    const [mode, setMode] =
        useState<Mode>("single");

    const [algorithm, setAlgorithm] =
        useState<Algorithm>("A*");

    const [leftAlgorithm, setLeftAlgorithm] =
        useState<Algorithm>("BFS");

    const [rightAlgorithm, setRightAlgorithm] =
        useState<Algorithm>("A*");

    const [mazeType, setMazeType] =
        useState<MazeType>("random");

    const [density, setDensity] = useState(25);
    const [speed, setSpeed] = useState(10);

    const [walls, setWalls] =
        useState<Set<number>>(new Set());

    const [singleState, setSingleState] =
        useState<RaceState>(emptyRaceState);

    const [leftState, setLeftState] =
        useState<RaceState>(emptyRaceState);

    const [rightState, setRightState] =
        useState<RaceState>(emptyRaceState);

    const [isRunning, setIsRunning] =
        useState(false);

    const [raceComplete, setRaceComplete] =
        useState(false);

    const timers =
        useRef<ReturnType<typeof setTimeout>[]>([]);

    const runId = useRef(0);

    useEffect(() => {
        const currentRunId = runId;
        const currentTimers = timers;

        return () => {
            currentRunId.current++;
            currentTimers.current.forEach(clearTimeout);
            currentTimers.current = [];
        };
    }, []);

    function clearTimers() {
        timers.current.forEach(clearTimeout);
        timers.current = [];
    }

    function resetVisualization() {
        runId.current++;
        clearTimers();

        setSingleState(emptyRaceState());
        setLeftState(emptyRaceState());
        setRightState(emptyRaceState());

        setIsRunning(false);
        setRaceComplete(false);
    }

    function toggleWall(index: number) {
        if (
            isRunning ||
            index === START ||
            index === TARGET
        ) {
            return;
        }

        setWalls(previous => {
            const next = new Set(previous);

            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }

            return next;
        });

        resetVisualization();
    }

    function clearWalls() {
        if (isRunning) return;

        setWalls(new Set());
        resetVisualization();
    }

    function createMaze() {
        if (isRunning) return;

        const newWalls = generateMaze(mazeType, {
            rows: ROWS,
            cols: COLS,
            start: START,
            target: TARGET,
            density: density / 100
        });

        setWalls(newWalls);
        resetVisualization();
    }

    function schedule(
        callback: () => void,
        delay: number,
        currentRun: number
    ) {
        const timer = setTimeout(() => {
            if (runId.current !== currentRun) return;
            callback();
        }, delay);

        timers.current.push(timer);
    }

    function animateResult(
        result: SearchResult,
        computationMs: number,
        setter: Dispatch<SetStateAction<RaceState>>,
        currentRun: number
    ): number {
        setter({
            ...emptyRaceState(),
            result,
            computationMs,
            status: "Exploring..."
        });

        result.visitedOrder.forEach((cell, index) => {
            schedule(() => {
                setter(previous => ({
                    ...previous,
                    visited: new Set(previous.visited).add(cell),
                    explored: previous.explored + 1
                }));
            }, index * speed, currentRun);
        });

        const pathStart =
            result.visitedOrder.length * speed;

        result.path.forEach((cell, index) => {
            schedule(() => {
                setter(previous => ({
                    ...previous,
                    path: new Set(previous.path).add(cell),
                    status: "Drawing path..."
                }));
            }, pathStart + index * 30, currentRun);
        });

        const duration =
            pathStart + result.path.length * 30;

        schedule(() => {
            setter(previous => ({
                ...previous,
                status:
                    result.path.length > 0
                        ? "Path found!"
                        : "No path found"
            }));
        }, duration, currentRun);

        return duration;
    }

    function visualize() {
        if (isRunning) return;

        resetVisualization();
        setIsRunning(true);

        const currentRun = runId.current;

        if (mode === "single") {
            const search = measureSearch(algorithm, walls);

            const duration = animateResult(
                search.result,
                search.computationMs,
                setSingleState,
                currentRun
            );

            schedule(
                () => setIsRunning(false),
                duration,
                currentRun
            );

            return;
        }

        const left = measureSearch(leftAlgorithm, walls);
        const right = measureSearch(rightAlgorithm, walls);

        const leftDuration = animateResult(
            left.result,
            left.computationMs,
            setLeftState,
            currentRun
        );

        const rightDuration = animateResult(
            right.result,
            right.computationMs,
            setRightState,
            currentRun
        );

        schedule(() => {
            setIsRunning(false);
            setRaceComplete(true);
        }, Math.max(leftDuration, rightDuration), currentRun);
    }

    function changeMode(nextMode: Mode) {
        resetVisualization();
        setMode(nextMode);
    }

    function changeArena(nextArena: Arena) {
        if (nextArena === arena) return;

        resetVisualization();
        setArena(nextArena);
    }

    return (
        <main className="min-h-screen bg-slate-950 p-4 text-white md:p-8">
            <div className="mx-auto max-w-[1500px]">
                {/* Shared header */}
                <header className="mb-8">
                    <p className="text-sm font-semibold tracking-widest text-emerald-400">
                        INTERACTIVE ALGORITHM LAB
                    </p>

                    <h1 className="mt-3 text-4xl font-bold md:text-5xl">
                        Algorithm Arena
                    </h1>

                    <p className="mt-3 text-slate-400">
                        Visualize, compare, and understand algorithms
                        in real time.
                    </p>
                </header>

                {/* Shared arena navigation */}
                <nav aria-label="Arena navigation" className="mb-6 flex flex-wrap gap-3">
                    {([
                        ["home", "Home"],
                        ["pathfinding", "Pathfinding Arena"],
                        ["sorting", "Sorting Arena"],
                        ["searching", "Searching Arena"]
                    ] as const).map(([id, label]) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => changeArena(id)}
                            aria-current={arena === id ? "page" : undefined}
                            className={`h-12 rounded-xl px-5 font-semibold transition ${
    arena === id
        ? "bg-indigo-600 text-white"
        : "border border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-white"
}`}
                        >
                            {label}
                        </button>
                    ))}
                </nav>

                {arena === "home" ? (
                    <HomeDashboard onOpen={changeArena} />
                ) : arena === "pathfinding" ? (
                    <div className="space-y-5">
                        {/* Unified control card */}
                        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-6">
                            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        Pathfinding Arena
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-400">
                                        Explore how algorithms navigate a grid.
                                    </p>
                                </div>

                                <div className="inline-flex rounded-xl border border-slate-700 bg-slate-950 p-1">
                                    <button
                                        onClick={() => changeMode("single")}
                                        className={`rounded-lg px-5 py-2.5 text-sm font-semibold ${
    mode === "single"
        ? "bg-emerald-600 text-white"
        : "text-slate-400 hover:text-white"
}`}
                                    >
                                        Single Mode
                                    </button>

                                    <button
                                        onClick={() => changeMode("race")}
                                        className={`rounded-lg px-5 py-2.5 text-sm font-semibold ${
    mode === "race"
        ? "bg-emerald-600 text-white"
        : "text-slate-400 hover:text-white"
}`}
                                    >
                                        Race Mode
                                    </button>
                                </div>
                            </div>

                            {/* Aligned primary controls */}
                            <div className="flex flex-wrap items-end gap-3">
                                {mode === "single" && (
                                    <div className="w-full sm:w-56">
                                        <label className="mb-2 block text-xs font-medium text-slate-400">
                                            Algorithm
                                        </label>

                                        <AlgorithmSelect
                                            value={algorithm}
                                            disabled={isRunning}
                                            onChange={value => {
                                                setAlgorithm(value);
                                                resetVisualization();
                                            }}
                                        />
                                    </div>
                                )}

                                <button
                                    onClick={createMaze}
                                    disabled={isRunning}
                                    className="h-11 rounded-lg bg-indigo-600 px-5 font-medium hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    Generate Maze
                                </button>

                                <button
                                    onClick={visualize}
                                    disabled={isRunning}
                                    className="h-11 rounded-lg bg-emerald-600 px-5 font-semibold hover:bg-emerald-500 disabled:opacity-50"
                                >
                                    {isRunning
                                        ? "Running..."
                                        : mode === "race"
                                            ? "Start Race"
                                            : "Visualize"}
                                </button>

                                <button
                                    onClick={clearWalls}
                                    disabled={isRunning}
                                    className="h-11 rounded-lg bg-slate-700 px-5 hover:bg-slate-600 disabled:opacity-50"
                                >
                                    Clear Walls
                                </button>

                                <button
                                    onClick={resetVisualization}
                                    className="h-11 rounded-lg border border-slate-600 px-5 hover:bg-slate-800"
                                >
                                    Reset
                                </button>
                            </div>

                            {/* Advanced settings */}
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
                                            Maze Type
                                        </label>

                                        <select
                                            value={mazeType}
                                            disabled={isRunning}
                                            onChange={e =>
                                                setMazeType(
                                                    e.target.value as MazeType
                                                )
                                            }
                                            className="h-11 w-full max-w-64 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
                                        >
                                            <option value="random">
                                                Random Obstacles
                                            </option>
                                            <option value="recursive">
                                                Recursive Backtracking
                                            </option>
                                        </select>

                                        <p className="mt-1 text-xs text-slate-500">
                                            How obstacles are generated
                                        </p>
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="mb-3 block text-sm text-slate-400">
                                            Wall Density: {density}%
                                        </label>

                                        <input
                                            type="range"
                                            min="10"
                                            max="45"
                                            step="5"
                                            value={density}
                                            disabled={
                                                isRunning ||
                                                mazeType !== "random"
                                            }
                                            onChange={e =>
                                                setDensity(Number(e.target.value))
                                            }
                                            className="h-11 w-full max-w-64 accent-indigo-500 disabled:opacity-40"
                                        />

                                        <p className="mt-1 text-xs text-slate-500">
                                            {mazeType === "random"
                                                ? "Percentage of blocked cells"
                                                : "Only applies to random obstacles"}
                                        </p>
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="mb-3 block text-sm text-slate-400">
                                            Animation Speed
                                        </label>

                                        <input
                                            type="range"
                                            min="1"
                                            max="50"
                                            value={51 - speed}
                                            disabled={isRunning}
                                            onChange={e =>
                                                setSpeed(
                                                    51 - Number(e.target.value)
                                                )
                                            }
                                            className="h-11 w-full max-w-64 accent-emerald-500"
                                        />

                                        <div className="flex w-full max-w-64 justify-between text-xs text-slate-500">
                                            <span>Slow</span>
                                            <span>Fast</span>
                                        </div>
                                    </div>
                                </div>
                            </details>
                        </section>

                        {/* Single visualization */}
                        {mode === "single" && (
                            <>
                                <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-6">
                                    <div className="mb-5 flex items-center justify-between gap-4">
                                        <h3 className="text-lg font-semibold">
                                            Visualization
                                        </h3>

                                        <p className="text-sm text-emerald-400">
                                            {singleState.status}
                                        </p>
                                    </div>

                                    <SearchProgress
                                        algorithm={algorithm}
                                        state={singleState}
                                    />

                                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                        <Grid
                                            walls={walls}
                                            visited={singleState.visited}
                                            path={singleState.path}
                                            disabled={isRunning}
                                            onCellClick={toggleWall}
                                        />
                                    </div>

                                    <div className="mt-5">
                                        <GridLegend />
                                    </div>
                                </section>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <StatCard
                                        label="Nodes Explored"
                                        value={singleState.explored}
                                    />

                                    <StatCard
                                        label="Path Length"
                                        value={
                                            singleState.result
                                                ? singleState.result.path.length > 0
                                                    ? singleState.result.path.length - 1
                                                    : "No path"
                                                : "—"
                                        }
                                    />

                                    <StatCard
                                        label="Computation Time"
                                        value={
                                            singleState.computationMs !== null
                                                ? `${singleState.computationMs.toFixed(3)} ms`
                                                : "—"
                                        }
                                    />
                                </div>
                            </>
                        )}

                        {/* Race visualization */}
                        {mode === "race" && (
                            <>
                                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                                    <RacePanel
                                        title="Competitor 1"
                                        algorithm={leftAlgorithm}
                                        onAlgorithmChange={value => {
                                            setLeftAlgorithm(value);
                                            resetVisualization();
                                        }}
                                        state={leftState}
                                        walls={walls}
                                        isRunning={isRunning}
                                        onCellClick={toggleWall}
                                    />

                                    <RacePanel
                                        title="Competitor 2"
                                        algorithm={rightAlgorithm}
                                        onAlgorithmChange={value => {
                                            setRightAlgorithm(value);
                                            resetVisualization();
                                        }}
                                        state={rightState}
                                        walls={walls}
                                        isRunning={isRunning}
                                        onCellClick={toggleWall}
                                    />
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                                    <GridLegend />
                                </div>

                                {raceComplete && (
                                    <>
                                        <RaceResults
                                            leftAlgorithm={leftAlgorithm}
                                            rightAlgorithm={rightAlgorithm}
                                            leftState={leftState}
                                            rightState={rightState}
                                        />

                                        <BenchmarkPanel
                                            key={`${leftAlgorithm}-${rightAlgorithm}-${Array.from(walls).join(",")}`}
                                            leftAlgorithm={leftAlgorithm}
                                            rightAlgorithm={rightAlgorithm}
                                            walls={walls}
                                            disabled={isRunning}
                                        />
                                    </>
                                )}
                            </>
                        )}
                    </div>
                ) : arena === "sorting" ? (
                    <SortingArena />
                ) : (
                    <SearchingArena />
                )}

                <footer className="mt-10 text-center text-sm text-slate-500">
                    Algorithm Arena — Next.js · TypeScript · Tailwind CSS
                </footer>
            </div>
        </main>
    );
}