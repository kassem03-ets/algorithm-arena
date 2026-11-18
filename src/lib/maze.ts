
export type MazeType = "random" | "recursive";

type MazeOptions = {
    rows: number;
    cols: number;
    start: number;
    target: number;
    density?: number;
};

function neighbors(
    cell: number,
    rows: number,
    cols: number
): number[] {
    const row = Math.floor(cell / cols);
    const col = cell % cols;

    return [
        row > 0 ? cell - cols : -1,
        row < rows - 1 ? cell + cols : -1,
        col > 0 ? cell - 1 : -1,
        col < cols - 1 ? cell + 1 : -1
    ].filter(cell => cell !== -1);
}

function hasPath(
    rows: number,
    cols: number,
    start: number,
    target: number,
    walls: Set<number>
): boolean {
    const queue = [start];
    const visited = new Set<number>([start]);

    for (let head = 0; head < queue.length; head++) {
        const current = queue[head];

        if (current === target) return true;

        for (const next of neighbors(current, rows, cols)) {
            if (!walls.has(next) && !visited.has(next)) {
                visited.add(next);
                queue.push(next);
            }
        }
    }

    return false;
}

export function randomMaze({
                               rows,
                               cols,
                               start,
                               target,
                               density = 0.25
                           }: MazeOptions): Set<number> {
    // Retry until the start and target are connected.
    for (let attempt = 0; attempt < 100; attempt++) {
        const walls = new Set<number>();

        for (let i = 0; i < rows * cols; i++) {
            if (
                i !== start &&
                i !== target &&
                Math.random() < density
            ) {
                walls.add(i);
            }
        }

        if (hasPath(rows, cols, start, target, walls)) {
            return walls;
        }
    }

    // Guaranteed fallback: empty grid
    return new Set<number>();
}

export function recursiveMaze({
                                  rows,
                                  cols,
                                  start,
                                  target
                              }: MazeOptions): Set<number> {
    const walls = new Set<number>();

    // Begin with every cell blocked
    for (let i = 0; i < rows * cols; i++) {
        walls.add(i);
    }

    const visited = new Set<number>();

    // Carve corridors using randomized depth-first search.
    function carve(cell: number) {
        visited.add(cell);
        walls.delete(cell);

        const row = Math.floor(cell / cols);
        const col = cell % cols;

        const directions = [
            [-2, 0],
            [2, 0],
            [0, -2],
            [0, 2]
        ];

        // Shuffle directions
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] =
                [directions[j], directions[i]];
        }

        for (const [dr, dc] of directions) {
            const nextRow = row + dr;
            const nextCol = col + dc;

            if (
                nextRow < 0 ||
                nextRow >= rows ||
                nextCol < 0 ||
                nextCol >= cols
            ) {
                continue;
            }

            const next = nextRow * cols + nextCol;

            if (visited.has(next)) continue;

            const middle =
                (row + dr / 2) * cols + (col + dc / 2);

            walls.delete(middle);
            carve(next);
        }
    }

    // Start carving at an even-coordinate cell
    carve(0);

    // Connect start and target to the carved maze.
    for (const endpoint of [start, target]) {
        walls.delete(endpoint);

        if (
            !neighbors(endpoint, rows, cols).some(
                cell => !walls.has(cell)
            )
        ) {
            const adjacent = neighbors(endpoint, rows, cols);
            if (adjacent.length > 0) {
                walls.delete(adjacent[0]);
            }
        }
    }

    // If an endpoint was isolated, use a guaranteed fallback.
    if (!hasPath(rows, cols, start, target, walls)) {
        return randomMaze({
            rows,
            cols,
            start,
            target,
            density: 0.25
        });
    }

    return walls;
}

export function generateMaze(
    type: MazeType,
    options: MazeOptions
): Set<number> {
    if (type === "recursive") {
        return recursiveMaze(options);
    }

    return randomMaze(options);
}
