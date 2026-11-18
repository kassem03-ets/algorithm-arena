
"use client";

import { useEffect, useRef, useState } from "react";
import { bfs } from "@/algorithms/bfs";
import { dfs } from "@/algorithms/dfs";
import { dijkstra } from "@/algorithms/dijkstra";
import { astar } from "@/algorithms/astar";

type Algorithm = "A*" | "Dijkstra" | "BFS" | "DFS";

type SearchResult = {
  visitedOrder: number[];
  path: number[];
};

const ROWS = 20;
const COLS = 35;
const CELL_SIZE = 26;
const CELL_GAP = 2;

const START = 10 * COLS + 5;
const TARGET = 10 * COLS + 29;

const algorithms: Algorithm[] = [
  "A*", "Dijkstra", "BFS", "DFS"
];

export default function Home() {
  const [algorithm, setAlgorithm] = useState<Algorithm>("A*");
  const [walls, setWalls] = useState<Set<number>>(new Set());
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [path, setPath] = useState<Set<number>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(10);
  const [status, setStatus] = useState("Ready to visualize");
  const [result, setResult] = useState<SearchResult | null>(null);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function resetVisualization() {
    clearTimers();
    setVisited(new Set());
    setPath(new Set());
    setResult(null);
    setIsRunning(false);
    setStatus("Ready to visualize");
  }

  function toggleWall(index: number) {
    if (isRunning || index === START || index === TARGET) return;

    setWalls(previous => {
      const next = new Set(previous);

      if (next.has(index)) next.delete(index);
      else next.add(index);

      return next;
    });

    setVisited(new Set());
    setPath(new Set());
    setResult(null);
    setStatus("Ready to visualize");
  }

  function runAlgorithm(): SearchResult {
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

  function visualize() {
    if (isRunning) return;

    resetVisualization();
    setIsRunning(true);
    setStatus(`Running ${algorithm}...`);

    const searchResult = runAlgorithm();
    setResult(searchResult);

    searchResult.visitedOrder.forEach((cell, index) => {
      timers.current.push(
          setTimeout(() => {
            setVisited(previous => new Set(previous).add(cell));
          }, index * speed)
      );
    });

    const pathStart = searchResult.visitedOrder.length * speed;

    searchResult.path.forEach((cell, index) => {
      timers.current.push(
          setTimeout(() => {
            setPath(previous => new Set(previous).add(cell));
          }, pathStart + index * 30)
      );
    });

    const totalDuration =
        pathStart + searchResult.path.length * 30;

    timers.current.push(
        setTimeout(() => {
          setIsRunning(false);
          setStatus(
              searchResult.path.length > 0
                  ? "Path found!"
                  : "No path found."
          );
        }, totalDuration)
    );
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

  return (
      <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
        <div className="mx-auto max-w-7xl">

          <header className="mb-10">
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

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

            {/* Controls */}
            <div className="mb-6 flex flex-wrap items-center gap-4">

              <select
                  value={algorithm}
                  disabled={isRunning}
                  onChange={e => {
                    setAlgorithm(e.target.value as Algorithm);
                    resetVisualization();
                  }}
                  className="rounded-lg bg-slate-800 px-4 py-3"
              >
                {algorithms.map(a => (
                    <option key={a} value={a}>
                      {a === "A*" ? "A* Search" :
                          a === "BFS" ? "Breadth-First Search" :
                              a === "DFS" ? "Depth-First Search" :
                                  "Dijkstra"}
                    </option>
                ))}
              </select>

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
                  className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold hover:bg-emerald-500 disabled:opacity-50"
              >
                {isRunning ? "Visualizing..." : "Visualize"}
              </button>
            </div>

            {/* Speed */}
            <div className="mb-6 flex items-center gap-4">
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

            <div className="mb-5 text-sm text-emerald-400">
              {status}
            </div>

            {/* Uniform Grid */}
            <div className="overflow-x-auto">
              <div
                  className="mx-auto grid w-max"
                  style={{
                    gridTemplateColumns:
                        `repeat(${COLS}, ${CELL_SIZE}px)`,
                    gap: `${CELL_GAP}px`,
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
                              onClick={() => toggleWall(index)}
                              disabled={isRunning}
                              aria-label={`Grid cell ${index}`}
                              className={`h-[26px] w-[26px] shrink-0 rounded-[2px] ${color}`}
                          />
                      );
                    }
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-400">
              <span>🟢 Start</span>
              <span>🔴 Target</span>
              <span>⬜ Wall</span>
              <span>🔵 Visited</span>
              <span>🟡 Path</span>
            </div>

            {/* Statistics */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label="Algorithm" value={algorithm} />
              <StatCard
                  label="Nodes Explored"
                  value={result ? result.visitedOrder.length : "—"}
              />
              <StatCard
                  label="Path Length"
                  value={
                    result
                        ? result.path.length > 0
                            ? result.path.length - 1
                            : "No path"
                        : "—"
                  }
              />
            </div>

          </section>

          <footer className="mt-8 text-center text-sm text-slate-500">
            Algorithm Arena — Next.js · TypeScript · Tailwind CSS
          </footer>

        </div>
      </main>
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
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <p className="text-sm text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      </div>
  );
}
