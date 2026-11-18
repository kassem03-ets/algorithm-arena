
export function astar(
    rows: number,
    cols: number,
    start: number,
    target: number,
    walls: Set<number>
) {
    const total = rows * cols;

    const gScore = Array<number>(total).fill(Infinity);
    const fScore = Array<number>(total).fill(Infinity);

    const previous = new Map<number, number>();
    const openSet = new Set<number>([start]);
    const closedSet = new Set<number>();
    const visitedOrder: number[] = [];

    // Manhattan distance heuristic
    function heuristic(a: number, b: number): number {
        const rowA = Math.floor(a / cols);
        const colA = a % cols;

        const rowB = Math.floor(b / cols);
        const colB = b % cols;

        return Math.abs(rowA - rowB) + Math.abs(colA - colB);
    }

    gScore[start] = 0;
    fScore[start] = heuristic(start, target);

    while (openSet.size > 0) {
        let current = -1;
        let lowestScore = Infinity;

        // Find the node with the lowest estimated total cost
        for (const node of openSet) {
            if (fScore[node] < lowestScore) {
                lowestScore = fScore[node];
                current = node;
            }
        }

        if (current === -1) break;

        openSet.delete(current);
        closedSet.add(current);
        visitedOrder.push(current);

        if (current === target) break;

        const row = Math.floor(current / cols);
        const col = current % cols;

        const neighbors = [
            row > 0 ? current - cols : -1,
            row < rows - 1 ? current + cols : -1,
            col > 0 ? current - 1 : -1,
            col < cols - 1 ? current + 1 : -1,
        ];

        for (const neighbor of neighbors) {
            if (
                neighbor === -1 ||
                walls.has(neighbor) ||
                closedSet.has(neighbor)
            ) {
                continue;
            }

            const tentativeGScore = gScore[current] + 1;

            if (tentativeGScore < gScore[neighbor]) {
                previous.set(neighbor, current);

                gScore[neighbor] = tentativeGScore;
                fScore[neighbor] =
                    tentativeGScore + heuristic(neighbor, target);

                openSet.add(neighbor);
            }
        }
    }

    const path: number[] = [];

    if (closedSet.has(target)) {
        let current = target;

        while (current !== start) {
            path.unshift(current);
            current = previous.get(current)!;
        }

        path.unshift(start);
    }

    return { visitedOrder, path };
}
