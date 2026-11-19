
"use client";

import { useEffect, useRef, useState } from "react";

import {
    runStringSearch,
    STRING_ALGORITHMS,
    type StringAlgorithm,
    type StringSearchStep
} from "@/algorithms/searching/stringSearch";

type Mode = "single" | "race";
type Lane = "single" | "left" | "right";

type LaneState = {
    steps: StringSearchStep[];
    index: number;
    status: "ready" | "running" | "complete";
};

const DEFAULT_TEXT = "ABABDABACDABABCABAB";
const DEFAULT_PATTERN = "ABABCABAB";

function emptyLane(): LaneState {
    return {
        steps: [],
        index: 0,
        status: "ready"
    };
}

function lastStep(lane: LaneState): StringSearchStep | null {
    return lane.index > 0
        ? lane.steps[lane.index - 1]
        : null;
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
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-2 text-xl font-bold text-white">
                {value}
            </p>
        </div>
    );
}

function CharacterRow({
                          text,
                          pattern,
                          step,
                          animationDuration
                      }: {
    text: string;
    pattern: string;
    step: StringSearchStep | null;
    animationDuration: number;
}) {
    const shift = step?.shift ?? 0;
    const checking = step?.checking ?? null;
    const matched = new Set(step?.matched ?? []);
    const matches = step?.matches ?? [];

    const cellWidth = 38;
    const gap = 4;
    const stride = cellWidth + gap;

    const previousShiftRef = useRef(0);
    const [shiftDistance, setShiftDistance] = useState(0);

    useEffect(() => {
        const previous = previousShiftRef.current;

        if (shift !== previous) {
            setShiftDistance(shift - previous);
            previousShiftRef.current = shift;
        }
    }, [shift]);

    const isFullMatch = (index: number) =>
        matches.some(
            start =>
                index >= start &&
                index < start + pattern.length
        );

    const isMismatch =
        step?.phase === "searching" &&
        checking !== null &&
        text[shift + checking] !== pattern[checking];

    const transitionDuration = Math.min(
        450,
        animationDuration * 0.8
    );

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div
                className="relative"
                style={{
                    width: Math.max(
                        100,
                        text.length * stride - gap
                    ),
                    minHeight: 205
                }}
            >
                <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Text
                </div>

                <div className="flex gap-1">
                    {Array.from(text).map((char, index) => {
                        const isChecking =
                            checking !== null &&
                            shift + checking === index;

                        const isMatched =
                            index >= shift &&
                            matched.has(index - shift);

                        const isFound = isFullMatch(index);

                        const isCurrentMismatch =
                            isMismatch && isChecking;

                        const color = isFound
                            ? "border-emerald-400 bg-emerald-500/25 text-emerald-300"
                            : isCurrentMismatch
                                ? "border-rose-400 bg-rose-500/25 text-rose-300"
                                : isChecking
                                    ? "border-amber-400 bg-amber-500/25 text-amber-300"
                                    : isMatched
                                        ? "border-cyan-400 bg-cyan-500/20 text-cyan-300"
                                        : "border-slate-700 bg-slate-800 text-white";

                        return (
                            <div
                                key={index}
                                className="flex shrink-0 flex-col items-center gap-1"
                                style={{ width: cellWidth }}
                            >
                                <div
                                    className={`flex h-10 w-full items-center justify-center rounded-md border font-mono text-sm font-semibold transition-colors duration-200 ${color}`}
                                >
                                    {char === " " ? "·" : char}
                                </div>

                                <span className="text-[10px] text-slate-500">
                  {index}
                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Pattern
          </span>

                    {shiftDistance !== 0 && step && (
                        <span className="text-xs text-violet-400">
              {shiftDistance > 0 ? "→" : "←"}{" "}
                            Shifted {Math.abs(shiftDistance)}{" "}
                            {Math.abs(shiftDistance) === 1
                                ? "position"
                                : "positions"}
            </span>
                    )}
                </div>

                <div className="relative mt-3 h-11">
                    <div
                        className="absolute top-0 flex gap-1 transition-[left] ease-in-out"
                        style={{
                            left: shift * stride,
                            transitionDuration: `${transitionDuration}ms`
                        }}
                    >
                        {Array.from(pattern).map((char, index) => {
                            const isChecking = checking === index;
                            const isMatched = matched.has(index);
                            const isCurrentMismatch =
                                isMismatch && isChecking;

                            const color =
                                step?.phase === "found"
                                    ? "border-emerald-400 bg-emerald-500/25 text-emerald-300"
                                    : isCurrentMismatch
                                        ? "border-rose-400 bg-rose-500/25 text-rose-300"
                                        : isChecking
                                            ? "border-amber-400 bg-amber-500/25 text-amber-300"
                                            : isMatched
                                                ? "border-cyan-400 bg-cyan-500/20 text-cyan-300"
                                                : "border-indigo-700 bg-indigo-500/20 text-indigo-200";

                            return (
                                <div
                                    key={index}
                                    style={{ width: cellWidth }}
                                    className={`flex h-10 shrink-0 items-center justify-center rounded-md border font-mono text-sm font-semibold transition-colors duration-200 ${color}`}
                                >
                                    {char === " " ? "·" : char}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Visualization({
                           title,
                           algorithm,
                           text,
                           pattern,
                           lane,
                           isPaused,
                           animationDuration
                       }: {
    title: string;
    algorithm: StringAlgorithm;
    text: string;
    pattern: string;
    lane: LaneState;
    isPaused: boolean;
    animationDuration: number;
}) {
    const step = lastStep(lane);
    const total = lane.steps.length;

    const progress =
        total > 0 ? (lane.index / total) * 100 : 0;

    const status =
        isPaused && lane.status === "running"
            ? "Paused"
            : lane.status === "running"
                ? "Searching..."
                : lane.status === "complete"
                    ? "Complete"
                    : "Ready";

    return (
        <section className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">
                    {title}
                </h3>

                <span className="text-sm text-emerald-400">
          {status}
        </span>
            </div>

            <div className="mb-4 flex items-center justify-between gap-3 text-xs text-slate-400">
                <span>{algorithm}</span>

                <span className="tabular-nums">
          {lane.index} / {total} steps
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

            <CharacterRow
                text={text}
                pattern={pattern}
                step={step}
                animationDuration={animationDuration}
            />

            <div className="mt-5 min-h-14 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
                {step?.message ??
                    "Enter a text and pattern, then start searching."}
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
                <span>🟡 Comparing</span>
                <span>🔴 Mismatch</span>
                <span>🔵 Matched characters</span>
                <span>🟢 Found pattern</span>
                <span>🟣 Pattern position</span>
            </div>
        </section>
    );
}

export default function SearchingArena() {
    const [mode, setMode] = useState<Mode>("single");

    const [algorithm, setAlgorithm] =
        useState<StringAlgorithm>("KMP");

    const [leftAlgorithm, setLeftAlgorithm] =
        useState<StringAlgorithm>("Naive Search");

    const [rightAlgorithm, setRightAlgorithm] =
        useState<StringAlgorithm>("KMP");

    const [text, setText] = useState(DEFAULT_TEXT);
    const [pattern, setPattern] = useState(DEFAULT_PATTERN);

    const [speed, setSpeed] = useState(45);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const [single, setSingle] =
        useState<LaneState>(emptyLane);

    const [left, setLeft] =
        useState<LaneState>(emptyLane);

    const [right, setRight] =
        useState<LaneState>(emptyLane);

    const timer =
        useRef<ReturnType<typeof setTimeout> | null>(null);

    const runId = useRef(0);
    const pausedRef = useRef(false);

    const lanesRef = useRef<Record<Lane, LaneState>>({
        single: emptyLane(),
        left: emptyLane(),
        right: emptyLane()
    });

    const delay = Math.round(1400 - speed * 13);
    const delayRef = useRef(delay);
    delayRef.current = delay;


    useEffect(() => {
        const currentRunId = runId;
        const currentTimer = timer;

        return () => {
            currentRunId.current++;

            if (currentTimer.current !== null) {
                clearTimeout(currentTimer.current);
                currentTimer.current = null;
            }
        };
    }, []);


    function clearTimer() {
        if (timer.current !== null) {
            clearTimeout(timer.current);
            timer.current = null;
        }
    }

    function updateLane(
        key: Lane,
        state: LaneState
    ) {
        lanesRef.current[key] = state;

        if (key === "single") setSingle(state);
        if (key === "left") setLeft(state);
        if (key === "right") setRight(state);
    }

    function reset() {
        runId.current++;
        clearTimer();

        pausedRef.current = false;
        setIsRunning(false);
        setIsPaused(false);

        updateLane("single", emptyLane());
        updateLane("left", emptyLane());
        updateLane("right", emptyLane());
    }

    function playNext(currentRun: number) {
        if (
            runId.current !== currentRun ||
            pausedRef.current
        ) {
            return;
        }

        const activeKeys: Lane[] =
            mode === "single"
                ? ["single"]
                : ["left", "right"];

        let remaining = false;

        for (const key of activeKeys) {
            const lane = lanesRef.current[key];

            if (lane.index >= lane.steps.length) {
                continue;
            }

            const nextIndex = lane.index + 1;

            updateLane(key, {
                ...lane,
                index: nextIndex,
                status:
                    nextIndex >= lane.steps.length
                        ? "complete"
                        : "running"
            });

            if (nextIndex < lane.steps.length) {
                remaining = true;
            }
        }

        if (!remaining) {
            setIsRunning(false);
            setIsPaused(false);
            return;
        }

        timer.current = setTimeout(
            () => playNext(currentRun),
            delayRef.current
        );
    }

    function start() {
        if (isRunning || !text || !pattern) return;
        if (pattern.length > text.length) return;

        reset();

        if (mode === "single") {
            updateLane("single", {
                steps: runStringSearch(
                    algorithm,
                    text,
                    pattern
                ),
                index: 0,
                status: "running"
            });
        } else {
            updateLane("left", {
                steps: runStringSearch(
                    leftAlgorithm,
                    text,
                    pattern
                ),
                index: 0,
                status: "running"
            });

            updateLane("right", {
                steps: runStringSearch(
                    rightAlgorithm,
                    text,
                    pattern
                ),
                index: 0,
                status: "running"
            });
        }

        setIsRunning(true);
        playNext(runId.current);
    }

    function togglePause() {
        if (!isRunning) return;

        if (pausedRef.current) {
            pausedRef.current = false;
            setIsPaused(false);
            playNext(runId.current);
        } else {
            pausedRef.current = true;
            clearTimer();
            setIsPaused(true);
        }
    }

    function metrics(lane: LaneState) {
        const step = lastStep(lane);

        return {
            comparisons: step?.comparisons ?? 0,
            matches: step?.matches.length ?? 0,
            firstMatch: step?.matches[0] ?? "—"
        };
    }

    const leftMetrics = metrics(left);
    const rightMetrics = metrics(right);

    const raceFinished =
        mode === "race" &&
        left.status === "complete" &&
        right.status === "complete";

    let winner = "Tie";

    if (raceFinished) {
        if (
            leftMetrics.comparisons <
            rightMetrics.comparisons
        ) {
            winner = leftAlgorithm;
        } else if (
            rightMetrics.comparisons <
            leftMetrics.comparisons
        ) {
            winner = rightAlgorithm;
        }
    }

    const invalidPattern =
        pattern.length > text.length;

    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-6">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">
                            Searching Arena
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            Watch algorithms find patterns inside text.
                        </p>
                    </div>

                    <div className="inline-flex rounded-xl border border-slate-700 bg-slate-950 p-1">
                        <button
                            onClick={() => {
                                reset();
                                setMode("single");
                            }}
                            className={`rounded-lg px-5 py-2.5 text-sm font-semibold ${
                                mode === "single"
                                    ? "bg-emerald-600 text-white"
                                    : "text-slate-400 hover:text-white"
                            }`}
                        >
                            Single Mode
                        </button>

                        <button
                            onClick={() => {
                                reset();
                                setMode("race");
                            }}
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

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]">
                    <div>
                        <label className="mb-2 block text-xs font-medium text-slate-400">
                            Text
                        </label>

                        <input
                            value={text}
                            disabled={isRunning}
                            onChange={e => {
                                reset();
                                setText(e.target.value);
                            }}
                            maxLength={80}
                            className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 font-mono text-sm text-white outline-none focus:border-indigo-500"
                            placeholder="Enter text to search"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-medium text-slate-400">
                            Pattern
                        </label>

                        <input
                            value={pattern}
                            disabled={isRunning}
                            onChange={e => {
                                reset();
                                setPattern(e.target.value);
                            }}
                            maxLength={30}
                            className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 font-mono text-sm text-white outline-none focus:border-indigo-500"
                            placeholder="Pattern to find"
                        />
                    </div>
                </div>

                {invalidPattern && (
                    <p className="mt-2 text-xs text-rose-400">
                        Pattern cannot be longer than the text.
                    </p>
                )}

                <div className="mt-4 flex flex-wrap items-end gap-3">
                    {mode === "single" && (
                        <div className="w-full sm:w-56">
                            <label className="mb-2 block text-xs font-medium text-slate-400">
                                Algorithm
                            </label>

                            <select
                                value={algorithm}
                                disabled={isRunning}
                                onChange={e => {
                                    reset();
                                    setAlgorithm(
                                        e.target.value as StringAlgorithm
                                    );
                                }}
                                className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
                            >
                                {STRING_ALGORITHMS.map(item => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={start}
                        disabled={
                            isRunning ||
                            !text ||
                            !pattern ||
                            invalidPattern
                        }
                        className="h-11 rounded-lg bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                        {isRunning
                            ? "Searching..."
                            : mode === "race"
                                ? "Start Race"
                                : "Start Search"}
                    </button>

                    {isRunning && (
                        <button
                            onClick={togglePause}
                            className="h-11 rounded-lg bg-amber-600 px-5 font-semibold text-white hover:bg-amber-500"
                        >
                            {isPaused ? "Resume" : "Pause"}
                        </button>
                    )}

                    <button
                        onClick={reset}
                        className="h-11 rounded-lg border border-slate-600 px-5 hover:bg-slate-800"
                    >
                        Reset
                    </button>
                </div>

                <details className="group mt-5 border-t border-slate-800 pt-4">
                    <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-slate-400 hover:text-white [&::-webkit-details-marker]:hidden">
            <span className="text-xs transition-transform group-open:rotate-90">
              ▶
            </span>
                        Advanced Settings
                    </summary>

                    <div className="mt-5 grid grid-cols-1 gap-6 border-t border-slate-800/60 pt-5 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label className="mb-3 block text-sm text-slate-400">
                                Animation Speed: {delay} ms / step
                            </label>

                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={speed}
                                onChange={e =>
                                    setSpeed(Number(e.target.value))
                                }
                                className="h-11 w-full max-w-64 accent-emerald-500"
                            />

                            <div className="flex max-w-64 justify-between text-xs text-slate-500">
                                <span>Slow</span>
                                <span>Fast</span>
                            </div>
                        </div>

                        <div>
                            <p className="mb-3 text-sm text-slate-400">
                                Text Length
                            </p>

                            <p className="flex h-11 items-center text-sm text-slate-300">
                                {text.length} characters
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                Maximum 80 characters
                            </p>
                        </div>

                        <div>
                            <p className="mb-3 text-sm text-slate-400">
                                Pattern Length
                            </p>

                            <p className="flex h-11 items-center text-sm text-slate-300">
                                {pattern.length} characters
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                Exact, case-sensitive matching
                            </p>
                        </div>
                    </div>
                </details>
            </section>

            {mode === "single" ? (
                <>
                    <Visualization
                        title="Visualization"
                        algorithm={algorithm}
                        text={text}
                        pattern={pattern}
                        lane={single}
                        isPaused={isPaused}
                        animationDuration={delay}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <StatCard
                            label="Comparisons"
                            value={metrics(single).comparisons}
                        />

                        <StatCard
                            label="Matches Found"
                            value={metrics(single).matches}
                        />

                        <StatCard
                            label="First Match Index"
                            value={metrics(single).firstMatch}
                        />
                    </div>
                </>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                        {(
                            [
                                {
                                    title: "Competitor 1",
                                    algorithm: leftAlgorithm,
                                    setAlgorithm: setLeftAlgorithm,
                                    lane: left
                                },
                                {
                                    title: "Competitor 2",
                                    algorithm: rightAlgorithm,
                                    setAlgorithm: setRightAlgorithm,
                                    lane: right
                                }
                            ] as const
                        ).map(item => (
                            <div
                                key={item.title}
                                className="min-w-0"
                            >
                                <div className="mb-3">
                                    <label className="mb-2 block text-xs text-slate-400">
                                        {item.title}
                                    </label>

                                    <select
                                        value={item.algorithm}
                                        disabled={isRunning}
                                        onChange={e => {
                                            reset();
                                            item.setAlgorithm(
                                                e.target.value as StringAlgorithm
                                            );
                                        }}
                                        className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
                                    >
                                        {STRING_ALGORITHMS.map(name => (
                                            <option key={name} value={name}>
                                                {name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <Visualization
                                    title={item.title}
                                    algorithm={item.algorithm}
                                    text={text}
                                    pattern={pattern}
                                    lane={item.lane}
                                    isPaused={isPaused}
                                    animationDuration={delay}
                                />

                                <div className="mt-3 grid grid-cols-2 gap-3">
                                    <StatCard
                                        label="Comparisons"
                                        value={
                                            metrics(item.lane).comparisons
                                        }
                                    />

                                    <StatCard
                                        label="Matches Found"
                                        value={metrics(item.lane).matches}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {raceFinished && (
                        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                                Comparison Result
                            </p>

                            <h3 className="mt-2 text-2xl font-bold">
                                {winner === "Tie"
                                    ? "It's a tie!"
                                    : `${winner} wins!`}
                            </h3>

                            <p className="mt-2 text-sm text-slate-400">
                                {leftAlgorithm}:{" "}
                                {leftMetrics.comparisons} comparisons
                                {" · "}
                                {rightAlgorithm}:{" "}
                                {rightMetrics.comparisons} comparisons
                            </p>

                            <p className="mt-3 text-xs text-slate-500">
                                Winner is determined by character comparisons.
                                Hash operations and preprocessing are not
                                included in this metric.
                            </p>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
