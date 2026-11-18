
"use client";

import { useEffect, useRef, useState } from "react";
import { bfs } from "@/algorithms/bfs";
import { dfs } from "@/algorithms/dfs";
import { dijkstra } from "@/algorithms/dijkstra";
import { astar } from "@/algorithms/astar";

type Algorithm = "A*" | "Dijkstra" | "BFS" | "DFS";
type Mode = "single" | "race";

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
  "A*", "Dijkstra", "BFS", "DFS"
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
          onChange={e => onChange(e.target.value as Algorithm)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white disabled:opacity-50"
      >
        {ALGORITHMS.map(a => (
            <option key={a} value={a}>
              {a === "A*" ? "A* Search" :
                  a === "BFS" ? "Breadth-First Search" :
                      a === "DFS" ? "Depth-First Search" :
                          "Dijkstra"}
            </option>
        ))}
      </select>
  );
}

function Grid({
                walls,
                visited,
                path,
                cellSize,
                disabled,
                onCellClick
              }: {
  walls: Set<number>;
  visited: Set<number>;
  path: Set<number>;
  cellSize: number;
  disabled: boolean;
  onCellClick: (index: number) => void;
}) {
  return (
      <div className="overflow-x-auto">
        <div
            className="mx-auto grid w-max"
            style={{
              gridTemplateColumns: `repeat(${COLS}, ${cellSize}px)`,
              gap: "2px"
            }}
        >
          {Array.from({ length: ROWS * COLS }, (_, index) => {
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
                    onClick={() => onCellClick(index)}
                    disabled={disabled}
                    aria-label={`Grid cell ${index}`}
                    className={`shrink-0 rounded-[2px] ${color}`}
                    style={{
                      width: cellSize,
                      height: cellSize
                    }}
                />
            );
          })}
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
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="mt-2 text-xl font-bold text-white">
          {value}
        </p>
      </div>
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
      <div className="min-w-0 rounded-2xl border border-slate-700 bg-slate-900 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              {title}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {state.status}
            </p>
          </div>
        </div>

        <div className="mb-5">
          <AlgorithmSelect
              value={algorithm}
              disabled={isRunning}
              onChange={onAlgorithmChange}
          />
        </div>

        <Grid
            walls={walls}
            visited={state.visited}
            path={state.path}
            cellSize={15}
            disabled={isRunning}
            onCellClick={onCellClick}
        />

        <div className="mt-5 grid grid-cols-3 gap-2">
          <StatCard
              label="Explored"
              value={state.explored}
          />
          <StatCard
              label="Path length"
              value={
                state.result
                    ? state.result.path.length > 0
                        ? state.result.path.length - 1
                        : "No path"
                    : "—"
              }
          />
          <StatCard
              label="Compute time"
              value={
                state.computationMs !== null
                    ? `${state.computationMs.toFixed(2)} ms`
                    : "—"
              }
          />
        </div>
      </div>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("single");

  const [algorithm, setAlgorithm] = useState<Algorithm>("A*");
  const [leftAlgorithm, setLeftAlgorithm] =
      useState<Algorithm>("BFS");
  const [rightAlgorithm, setRightAlgorithm] =
      useState<Algorithm>("A*");

  const [walls, setWalls] = useState<Set<number>>(new Set());

  const [singleState, setSingleState] =
      useState<RaceState>(emptyRaceState);

  const [leftState, setLeftState] =
      useState<RaceState>(emptyRaceState);

  const [rightState, setRightState] =
      useState<RaceState>(emptyRaceState);

  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(10);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const runId = useRef(0);

  useEffect(() => {
    return () => {
      runId.current++;
      timers.current.forEach(clearTimeout);
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
  }

  function toggleWall(index: number) {
    if (isRunning || index === START || index === TARGET) {
      return;
    }

    setWalls(previous => {
      const next = new Set(previous);

      if (next.has(index)) next.delete(index);
      else next.add(index);

      return next;
    });

    resetVisualization();
  }

  function clearWalls() {
    if (isRunning) return;

    setWalls(new Set());
    resetVisualization();
  }

  function generateMaze() {
    if (isRunning) return;

    const newWalls = new Set<number>();

    for (let i = 0; i < ROWS * COLS; i++) {
      if (
          i !== START &&
          i !== TARGET &&
          Math.random() < 0.25
      ) {
        newWalls.add(i);
      }
    }

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
      setter: React.Dispatch<React.SetStateAction<RaceState>>,
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

    const pathStart = result.visitedOrder.length * speed;

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
        status: result.path.length > 0
            ? "Path found!"
            : "No path found"
      }));
    }, duration, currentRun);

    return duration;
  }

  function measureSearch(selected: Algorithm) {
    const startTime = performance.now();
    const result = runSearch(selected, walls);
    const computationMs = performance.now() - startTime;

    return { result, computationMs };
  }

  function visualize() {
    if (isRunning) return;

    resetVisualization();
    setIsRunning(true);

    const currentRun = runId.current;

    if (mode === "single") {
      const search = measureSearch(algorithm);

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

    const left = measureSearch(leftAlgorithm);
    const right = measureSearch(rightAlgorithm);

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

    schedule(
        () => setIsRunning(false),
        Math.max(leftDuration, rightDuration),
        currentRun
    );
  }

  function changeMode(nextMode: Mode) {
    resetVisualization();
    setMode(nextMode);
  }

  return (
      <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
        <div className="mx-auto max-w-[1500px]">

          {/* Header */}
          <header className="mb-8">
            <p className="text-sm font-semibold tracking-widest text-emerald-400">
              INTERACTIVE ALGORITHM LAB
            </p>

            <h1 className="mt-3 text-4xl font-bold md:text-5xl">
              Algorithm Arena
            </h1>

            <p className="mt-3 text-slate-400">
              Visualize, compare, and understand algorithms in real time.
            </p>
          </header>

          {/* Mode Selector */}
          <div className="mb-6 inline-flex rounded-xl border border-slate-700 bg-slate-900 p-1">
            <button
                onClick={() => changeMode("single")}
                className={`rounded-lg px-5 py-3 text-sm font-semibold ${
                    mode === "single"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:text-white"
                }`}
            >
              Single Mode
            </button>

            <button
                onClick={() => changeMode("race")}
                className={`rounded-lg px-5 py-3 text-sm font-semibold ${
                    mode === "race"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:text-white"
                }`}
            >
              Algorithm Race
            </button>
          </div>

          {/* Shared Controls */}
          <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex flex-wrap items-center gap-4">
              <button
                  onClick={generateMaze}
                  disabled={isRunning}
                  className="rounded-lg bg-indigo-600 px-5 py-3 hover:bg-indigo-500 disabled:opacity-50"
              >
                Generate Maze
              </button>

              <button
                  onClick={clearWalls}
                  disabled={isRunning}
                  className="rounded-lg bg-slate-700 px-5 py-3 hover:bg-slate-600 disabled:opacity-50"
              >
                Clear Walls
              </button>

              <button
                  onClick={resetVisualization}
                  className="rounded-lg border border-slate-600 px-5 py-3 hover:bg-slate-800"
              >
                Reset
              </button>

              <button
                  onClick={visualize}
                  disabled={isRunning}
                  className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold hover:bg-emerald-500 disabled:opacity-50"
              >
                {isRunning
                    ? "Running..."
                    : mode === "race"
                        ? "Start Race"
                        : "Visualize"}
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <label className="text-sm text-slate-400">
                Animation Speed
              </label>

              <input
                  type="range"
                  min="1"
                  max="50"
                  value={51 - speed}
                  onChange={e =>
                      setSpeed(51 - Number(e.target.value))
                  }
                  disabled={isRunning}
                  className="w-48 accent-emerald-500"
              />

              <span className="text-sm text-slate-300">
              {speed <= 5 ? "Fast" :
                  speed <= 20 ? "Medium" : "Slow"}
            </span>
            </div>
          </section>

          {/* Single Mode */}
          {mode === "single" && (
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="mb-5 max-w-sm">
                  <AlgorithmSelect
                      value={algorithm}
                      disabled={isRunning}
                      onChange={value => {
                        setAlgorithm(value);
                        resetVisualization();
                      }}
                  />
                </div>

                <p className="mb-5 text-sm text-emerald-400">
                  {singleState.status}
                </p>

                <Grid
                    walls={walls}
                    visited={singleState.visited}
                    path={singleState.path}
                    cellSize={26}
                    disabled={isRunning}
                    onCellClick={toggleWall}
                />

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <StatCard
                      label="Algorithm"
                      value={algorithm}
                  />
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
                </div>
              </section>
          )}

          {/* Race Mode */}
          {mode === "race" && (
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
          )}

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-400">
            <span>🟢 Start</span>
            <span>🔴 Target</span>
            <span>⬜ Wall</span>
            <span>🔵 Visited</span>
            <span>🟡 Path</span>
          </div>

          <footer className="mt-10 text-center text-sm text-slate-500">
            Algorithm Arena — Next.js · TypeScript · Tailwind CSS
          </footer>
        </div>
      </main>
  );
}
